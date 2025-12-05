import React from 'react';

interface Props {
    isOpen: boolean;
    lat: number;
    lon: number;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<Props> = ({ isOpen, lat, lon, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2 style={{ marginTop: 0, color: '#333' }}>⚠️ Confirm Interception</h2>
                <p style={{ color: '#555' }}>
                    Are you sure you want to send the drone to these coordinates?
                </p>
                <div style={styles.coords}>
                    <strong>Lat:</strong> {lat.toFixed(6)}<br />
                    <strong>Lon:</strong> {lon.toFixed(6)}
                </div>
                <div style={styles.buttons}>
                    <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
                    <button onClick={onConfirm} style={styles.confirmBtn}>🚀 Confirm Launch</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'absolute' as 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '300px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center' as 'center',
    },
    coords: {
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px',
        margin: '15px 0',
        color: '#333',
        fontFamily: 'monospace',
    },
    buttons: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '10px',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#ccc',
        color: '#333',
        border: 'none',
        padding: '10px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    confirmBtn: {
        flex: 1,
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold' as 'bold',
    }
};

export default ConfirmationModal;
