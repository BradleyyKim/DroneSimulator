class DroneSimulator {
    constructor() {
        // Initial State: Alta Wind Energy Center, California
        this.home = { lat: 35.0337, lon: -118.3534, alt: 0 };
        this.position = { ...this.home };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.heading = 0;
        this.battery = 100.0;
        this.state = 'LANDED'; // LANDED, ARMED, TAKING_OFF, FLYING, RETURNING, LANDING

        this.targetAlt = 0;
        this.waypoints = [];
        this.currentWaypointIndex = 0;
        this.targetAlt = 0;
        this.waypoints = [];
        this.currentWaypointIndex = 0;
        this.speed = 0;
        this.windSpeed = 3.0; // Initial wind
        this.lastGustTime = 0;
    }

    arm() {
        if (this.state === 'LANDED') {
            this.state = 'ARMED';
            return true;
        }
        return false;
    }

    disarm() {
        if (this.state === 'ARMED' || this.state === 'LANDED') {
            this.state = 'LANDED';
            return true;
        }
        return false;
    }

    takeoff(altitude) {
        console.log(`[Sim] Takeoff requested. State: ${this.state}, TargetAlt: ${altitude}`);
        if (this.state === 'ARMED') {
            this.state = 'TAKING_OFF';
            this.targetAlt = altitude;
            console.log('[Sim] Takeoff accepted. State changed to TAKING_OFF');
            return true;
        }
        console.log('[Sim] Takeoff rejected.');
        return false;
    }

    land() {
        if (this.state !== 'LANDED') {
            this.state = 'LANDING';
            this.targetAlt = 0;
            return true;
        }
        return false;
    }

    startMission() {
        if (this.state === 'FLYING' || this.state === 'HOVERING') {
            // Generate a spiral pattern around the turbine
            this.waypoints = this.generateSpiralWaypoints(this.home, 50, 80, 5); // radius 50m, height 80m, 5 loops
            this.currentWaypointIndex = 0;
            this.state = 'MISSION';
            return true;
        }
        return false;
    }

    returnToHome() {
        this.state = 'RETURNING';
        this.waypoints = [this.home];
        this.currentWaypointIndex = 0;
        return true;
    }

    goto(lat, lon) {
        if (this.state === 'FLYING' || this.state === 'HOVERING' || this.state === 'MISSION') {
            this.state = 'INTERCEPT';
            this.waypoints = [{ lat, lon, alt: 50 }]; // Fly at 50m
            this.currentWaypointIndex = 0;
            return true;
        }
        return false;
    }

    failsafe() {
        this.state = 'RETURNING';
        this.waypoints = [this.home];
        this.currentWaypointIndex = 0;
        return true;
    }

    update(dt) {
        // Battery Logic
        if (this.state === 'LANDED') {
            // Auto Recharge at Home
            this.battery = Math.min(100, this.battery + (5.0 * dt)); // Fast charge
        } else {
            // Drain faster in Intercept mode
            const drainRate = this.state === 'INTERCEPT' ? 0.5 : 0.1;
            this.battery = Math.max(0, this.battery - (drainRate * dt));
        }

        // State Logic
        if (this.state === 'TAKING_OFF') {
            this.position.alt += 5.0 * dt; // Increased to 5m/s climb for visibility
            // console.log(`[Sim] Climbing... Alt: ${this.position.alt.toFixed(2)}`);
            if (this.position.alt >= this.targetAlt) {
                this.position.alt = this.targetAlt;
                this.state = 'HOVERING';
                console.log('[Sim] Reached target altitude. Hovering.');
            }
        } else if (this.state === 'LANDING') {
            this.position.alt -= 2.0 * dt; // Faster landing too
            if (this.position.alt <= 0) {
                this.position.alt = 0;
                this.state = 'LANDED';
            }
        } else if (this.state === 'MISSION' || this.state === 'RETURNING' || this.state === 'INTERCEPT') {
            this.moveToWaypoint(dt);
        }

        // Calculate Speed
        if (this.state === 'INTERCEPT') this.speed = 40.0; // Super Fast!
        else if (this.state === 'MISSION' || this.state === 'RETURNING') this.speed = 5.0;
        else this.speed = 0.0;

        // --- Wind Simulation ---
        // 1. Update Wind Speed (Random Gusts)
        if (Math.random() < 0.05) { // 5% chance to change wind
            const now = Date.now();
            // Only allow Gust if 30s passed since last Gust start
            if (Math.random() < 0.3 && (now - this.lastGustTime > 30000)) {
                // Gust!
                this.windSpeed = 10.0 + Math.random() * 8.0; // 10 ~ 18 m/s
                this.lastGustTime = now;
            } else {
                // Normal Breeze
                this.windSpeed = 2.0 + Math.random() * 4.0; // 2 ~ 6 m/s
            }
        }

        // 2. Apply Jitter (Only when airborne)
        if (this.state !== 'LANDED') {
            const jitterFactor = this.windSpeed * 0.000002; // Scale jitter by wind
            this.position.lat += (Math.random() - 0.5) * jitterFactor;
            this.position.lon += (Math.random() - 0.5) * jitterFactor;

            // Alt jitter (prevent going below 0)
            const altJitter = (Math.random() - 0.5) * (this.windSpeed * 0.05);
            this.position.alt = Math.max(0, this.position.alt + altJitter);
        }
    }

    moveToWaypoint(dt) {
        if (this.currentWaypointIndex >= this.waypoints.length) {
            if (this.state === 'RETURNING') this.land();
            else this.state = 'HOVERING';
            return;
        }

        const target = this.waypoints[this.currentWaypointIndex];
        const speed = this.state === 'INTERCEPT' ? 40.0 : 5.0;

        // Simple Lat/Lon interpolation
        const dLat = target.lat - this.position.lat;
        const dLon = target.lon - this.position.lon;
        const dAlt = target.alt - this.position.alt;

        // Scale factor for visual speed
        const step = 0.00005 * speed * dt;

        if (Math.abs(dLat) < step && Math.abs(dLon) < step && Math.abs(dAlt) < 1.0) {
            this.currentWaypointIndex++;
        } else {
            const angle = Math.atan2(dLon, dLat);
            this.position.lat += Math.cos(angle) * step;
            this.position.lon += Math.sin(angle) * step;

            // Altitude move
            if (Math.abs(dAlt) > 0.5) {
                this.position.alt += Math.sign(dAlt) * 2.0 * dt;
            }

            this.heading = (angle * 180 / Math.PI);
        }
    }

    generateSpiralWaypoints(center, radius, height, loops) {
        const waypoints = [];
        const pointsPerLoop = 16;
        const totalPoints = loops * pointsPerLoop;
        const altStep = height / totalPoints;

        // Radius in deg approx (1m approx 0.00001 deg)
        const rDeg = radius * 0.00001;

        for (let i = 0; i < totalPoints; i++) {
            const angle = (i / pointsPerLoop) * 2 * Math.PI;
            waypoints.push({
                lat: center.lat + Math.cos(angle) * rDeg,
                lon: center.lon + Math.sin(angle) * rDeg,
                alt: 10 + (i * altStep) // Start at 10m
            });
        }
        return waypoints;
    }

    getTelemetry() {
        return {
            latitude: this.position.lat,
            longitude: this.position.lon,
            altitude: this.position.alt,
            speed: this.speed,
            battery: this.battery,
            status: this.state,
            speed: this.speed,
            battery: this.battery,
            status: this.state,
            heading: this.heading,
            wind_speed: this.windSpeed
        };
    }
}

module.exports = { DroneSimulator };
