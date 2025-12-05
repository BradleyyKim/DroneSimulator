import { useEffect, useState } from 'react';
import CesiumViewer from './components/CesiumViewer';
import ControlPanel from './components/ControlPanel';
import TelemetryPanel from './components/TelemetryPanel';
import ConfirmationModal from './components/ConfirmationModal';
import WindWarning from './components/WindWarning';
import VideoFeed from './components/VideoFeed';
import Dashboard, { Widget as DashboardWidget } from './components/Dashboard';
import './App.css';

// Default State
const defaultTelemetry = {
  latitude: 35.0337,
  longitude: -118.3534,
  altitude: 0,
  speed: 0,
  battery: 100,
  status: 'DISCONNECTED',
  heading: 0,
  wind_speed: 0
};

function App() {
  const [telemetry, setTelemetry] = useState(defaultTelemetry);
  const [logs, setLogs] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCoords, setTargetCoords] = useState<{ lat: number, lon: number } | null>(null);

  // WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        if (isMounted) addLog('Connected to GCS Backend');
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (e) {
          console.error('Telemetry Parse Error', e);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        addLog('Disconnected. Reconnecting in 3s...');
        setTelemetry(prev => ({ ...prev, status: 'DISCONNECTED' }));
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        if (!isMounted) return;
        // Suppress errors during connection phase if unmounting
        if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
          console.error('WS Error', err);
        }
        ws?.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (ws) {
        // Prevent callbacks from firing during cleanup
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  // Command Handler (via REST Gateway)
  const sendCommand = async (type: string, param1: number = 0, param2: number = 0, param3: number = 0) => {
    addLog(`CMD: ${type}`);
    try {
      const res = await fetch('http://localhost:3001/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, param1, param2, param3 })
      });
      const data = await res.json();
      addLog(`ACK: ${data.message}`);
    } catch (e) {
      addLog(`ERR: ${e}`);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    setTargetCoords({ lat, lon });
    setIsModalOpen(true);
  };

  const handleConfirmIntercept = () => {
    if (targetCoords) {
      addLog(`TARGET: ${targetCoords.lat.toFixed(5)}, ${targetCoords.lon.toFixed(5)}`);
      sendCommand('GOTO', 0, targetCoords.lat, targetCoords.lon);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <WindWarning windSpeed={telemetry.wind_speed || 0} />
      <ConfirmationModal
        isOpen={isModalOpen}
        lat={targetCoords?.lat || 0}
        lon={targetCoords?.lon || 0}
        onConfirm={handleConfirmIntercept}
        onCancel={() => setIsModalOpen(false)}
      />

      {/* 3D Map Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <CesiumViewer telemetry={telemetry} onMapClick={handleMapClick} />
      </div>

      {/* Widget Dashboard Overlay */}
      <Dashboard>
        <DashboardWidget key="control" id="control" data-title="Command & Control">
          <ControlPanel sendCommand={sendCommand} />
        </DashboardWidget>
        <DashboardWidget key="telemetry" id="telemetry" data-title="Telemetry Data">
          <TelemetryPanel telemetry={telemetry} logs={logs} />
        </DashboardWidget>
        <DashboardWidget key="video" id="video" data-title="Live Video Feed">
          <VideoFeed status={telemetry.status} />
        </DashboardWidget>
      </Dashboard>
    </div>
  );
}

export default App;
