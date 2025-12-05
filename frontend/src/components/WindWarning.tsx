import React, { useEffect, useState } from 'react';

interface Props {
    windSpeed: number;
}

const WindWarning: React.FC<Props> = ({ windSpeed }) => {
    const [visible, setVisible] = useState(true);

    // Flashing effect
    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(v => !v);
        }, 500); // Toggle every 500ms
        return () => clearInterval(interval);
    }, []);

    if (windSpeed < 10.0) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: visible ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.2)',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            zIndex: 2000,
            boxShadow: '0 0 20px rgba(255,0,0,0.5)',
            transition: 'background-color 0.3s ease',
            textAlign: 'center',
            border: '2px solid #ff4444'
        }}>
            ⚠️ HIGH WIND WARNING ⚠️<br />
            <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>
                Current Gust: {windSpeed.toFixed(1)} m/s
            </span>
        </div>
    );
};

export default WindWarning;
