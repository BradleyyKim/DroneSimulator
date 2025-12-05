import React, { useRef, useCallback } from 'react';
import { Viewer, Entity, ScreenSpaceEventHandler, ScreenSpaceEvent } from 'resium';
import { Cartesian3, Color, ScreenSpaceEventType, Cartographic, Math as CesiumMath, CallbackProperty, Quaternion, HeadingPitchRoll, Matrix3, Matrix4, Transforms, JulianDate } from 'cesium';

interface Telemetry {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
}

interface Props {
    telemetry: Telemetry;
    onMapClick?: (lat: number, lon: number) => void;
}

const CesiumViewer: React.FC<Props> = ({ telemetry, onMapClick }) => {
    const viewerRef = useRef<any>(null);
    const hasFlown = useRef(false);

    // Callback ref to handle viewer initialization
    const setViewerRef = useCallback((element: any) => {
        if (element && element.cesiumElement) {
            viewerRef.current = element;

            // Fly to target only once when viewer is ready
            if (!hasFlown.current) {
                // Move camera South (-0.002 lat) and lower (150m) to look AT the turbine
                element.cesiumElement.camera.flyTo({
                    destination: Cartesian3.fromDegrees(-118.3544, 35.0302, 150),
                    orientation: { heading: 0, pitch: -0.2, roll: 0 },
                    duration: 2
                });
                hasFlown.current = true;
            }
        }
    }, []);

    // Handle Map Clicks
    const handleLeftClick = (movement: any) => {
        if (!onMapClick || !viewerRef.current) return;

        const viewer = viewerRef.current.cesiumElement;
        const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);

        if (cartesian) {
            const cartographic = Cartographic.fromCartesian(cartesian);
            const lon = CesiumMath.toDegrees(cartographic.longitude);
            const lat = CesiumMath.toDegrees(cartographic.latitude);
            onMapClick(lat, lon);
        }
    };

    // Helper to create a drone icon on the fly
    const getDroneIcon = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Draw Drone Body (Cross)
        ctx.fillStyle = '#333';
        ctx.fillRect(28, 10, 8, 44);
        ctx.fillRect(10, 28, 44, 8);

        // Draw Rotors (4 Circles)
        ctx.fillStyle = '#ff4444'; // Red rotors for visibility
        const drawRotor = (x: number, y: number) => {
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        drawRotor(14, 14);
        drawRotor(50, 14);
        drawRotor(14, 50);
        drawRotor(50, 50);

        return canvas.toDataURL();
    };

    const droneIcon = useRef(getDroneIcon());

    // Turbine Location (Fixed at Alta Wind Energy Center)
    const turbineHubPos = Cartesian3.fromDegrees(-118.3534, 35.0337, 80); // 80m hub height

    // Blade Logic - Memoize to prevent recreation on every render
    const bladeProperties = React.useMemo(() => {
        const positions = [0, 1, 2].map(index => new CallbackProperty((time: JulianDate | undefined) => {
            if (!time) return new Cartesian3();
            const seconds = JulianDate.toDate(time).getTime() / 1000;
            const speed = 2.0; // Rotation speed (rad/s)
            const angle = (seconds * speed) + (index * (2 * Math.PI / 3)); // 120 degree offset

            // Hub local frame
            const transform = Transforms.eastNorthUpToFixedFrame(turbineHubPos);

            // Blade offset from hub (rotating in Y-Z plane of the hub local frame)
            // centerDist: Distance from hub center to blade center (Half of blade length 40m)
            const centerDist = 20;

            // Local offset calculation (Circular motion in Y-Z plane)
            // We want the blade (Z-axis geometry) to point radially outward.
            // At angle 0, we want it pointing Up (+Z).
            // Position should be (0, 0, 20).
            // Orientation Roll(0) keeps it along +Z.
            // So: z = cos(angle) * r, y = -sin(angle) * r
            // Check angle=90: z=0, y=-20 (South). Orientation Roll(90) -> -Y (South). Correct.

            const y = -Math.sin(angle) * centerDist;
            const z = Math.cos(angle) * centerDist;

            const offset = new Cartesian3(0, y, z);
            const finalPos = new Cartesian3();
            Matrix4.multiplyByPoint(transform, offset, finalPos);

            return finalPos;
        }, false));

        const orientations = [0, 1, 2].map(index => new CallbackProperty((time: JulianDate | undefined) => {
            if (!time) return new Quaternion();
            const seconds = JulianDate.toDate(time).getTime() / 1000;
            const speed = 2.0;
            const angle = (seconds * speed) + (index * (2 * Math.PI / 3));

            // Orientation: Rotate around X axis (Roll)
            // 1. Get Hub Orientation (ENU)
            const transform = Transforms.eastNorthUpToFixedFrame(turbineHubPos);
            const rotationMatrix = Matrix4.getMatrix3(transform, new Matrix3());
            const hubQuat = Quaternion.fromRotationMatrix(rotationMatrix);

            // 2. Local Rotation (Spin around X axis)
            const localQuat = Quaternion.fromHeadingPitchRoll(new HeadingPitchRoll(0, 0, angle));

            // 3. Combine Hub Orientation + Local Rotation
            const finalQuat = new Quaternion();
            Quaternion.multiply(hubQuat, localQuat, finalQuat);

            return finalQuat;
        }, false));

        return { positions, orientations };
    }, []); // Empty dependency array since turbineHubPos is constant inside component (or should be moved out)

    // Drone Position
    const dronePos = Cartesian3.fromDegrees(
        telemetry.longitude,
        telemetry.latitude,
        telemetry.altitude
    );

    return (
        <Viewer full ref={setViewerRef} shouldAnimate={true}>
            <ScreenSpaceEventHandler>
                <ScreenSpaceEvent
                    action={handleLeftClick}
                    type={ScreenSpaceEventType.LEFT_DOUBLE_CLICK}
                />
            </ScreenSpaceEventHandler>

            {/* Wind Turbine Visualization (Simplified as Cylinder) */}
            <Entity
                name="Turbine Tower"
                position={Cartesian3.fromDegrees(-118.3534, 35.0337, 40)} // Center at 40m
                cylinder={{
                    length: 80,
                    topRadius: 2,
                    bottomRadius: 4,
                    material: Color.WHITE,
                }}
            />
            <Entity
                name="Turbine Nacelle"
                position={turbineHubPos}
                box={{
                    dimensions: new Cartesian3(10, 4, 4),
                    material: Color.GRAY,
                }}
            />

            {/* Rotating Blades */}
            {[0, 1, 2].map(i => (
                <Entity
                    key={`blade-${i}`}
                    name={`Blade ${i}`}
                    position={bladeProperties.positions[i] as any}
                    orientation={bladeProperties.orientations[i] as any}
                    box={{
                        dimensions: new Cartesian3(1, 2, 40),
                        material: Color.WHITE,
                    }}
                />
            ))}

            {/* Drone Entity */}
            <Entity
                name="Drone"
                position={dronePos}
                billboard={{
                    image: droneIcon.current,
                    scale: 0.8,
                    eyeOffset: new Cartesian3(0, 0, -10), // Draw slightly in front
                }}
                description="Inspection Drone"
            />
        </Viewer>
    );
};

export default CesiumViewer;
