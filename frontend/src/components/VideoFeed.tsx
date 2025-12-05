import React, { useEffect, useState } from 'react';

interface Props {
    status: string;
}

const VideoFeed: React.FC<Props> = ({ status }) => {
    // Simulate fluctuating stream stats
    const [stats, setStats] = useState({
        bitrate: 4.5,
        latency: 24,
        fps: 30
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                bitrate: 4.0 + Math.random(), // 4.0 ~ 5.0 Mbps
                latency: 20 + Math.floor(Math.random() * 10), // 20 ~ 30 ms
                fps: 29 + Math.floor(Math.random() * 2) // 29 ~ 30 fps
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const isStreaming = ['MISSION', 'INTERCEPT', 'FLYING', 'HOVERING', 'RETURNING'].includes(status);

    if (!isStreaming) {
        return (
            <div className="video-placeholder" style={styles.placeholder}>
                <div style={styles.noSignal}>
                    📶 NO SIGNAL<br />
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>DRONE IS LANDED OR DISCONNECTED</span>
                </div>
            </div>
        );
    }

    return (
        <div className="video-feed" style={styles.container}>
            <video
                src="/sampleVideo.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={styles.video}
            />

            {/* Overlays */}
            <div style={styles.liveBadge}>🔴 LIVE</div>

            <div style={styles.statsOverlay}>
                <div><strong>Protocol:</strong> WebRTC/UDP</div>
                <div><strong>Resolution:</strong> 1080p</div>
                <div><strong>Bitrate:</strong> {stats.bitrate.toFixed(2)} Mbps</div>
                <div><strong>Latency:</strong> {stats.latency} ms</div>
                <div><strong>FPS:</strong> {stats.fps}</div>
            </div>

            <div style={styles.crosshair}>+</div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100%',
        position: 'relative' as 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        borderRadius: '8px',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as 'cover',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        borderRadius: '8px',
        border: '1px solid #333'
    },
    noSignal: {
        color: '#555',
        textAlign: 'center' as 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold',
    },
    liveBadge: {
        position: 'absolute' as 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
    },
    statsOverlay: {
        position: 'absolute' as 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#0f0',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        textAlign: 'left' as 'left',
    },
    crosshair: {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '2rem',
        fontWeight: '100',
        pointerEvents: 'none' as 'none',
    }
};

export default VideoFeed;
