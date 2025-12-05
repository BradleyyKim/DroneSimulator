const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const WebSocket = require('ws');
const path = require('path');
const { DroneSimulator } = require('./droneSimulator');

// --- Configuration ---
const PROTO_PATH = path.join(__dirname, '../shared/drone.proto');
const GRPC_PORT = 50051;
const WS_PORT = 8080;

// --- Load Protobuf ---
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const droneProto = grpc.loadPackageDefinition(packageDefinition).drone;

// --- Initialize Simulator ---
const simulator = new DroneSimulator();

// --- gRPC Service Implementation ---
function sendCommand(call, callback) {
    const cmd = call.request;
    console.log(`[gRPC] Received Command: ${cmd.type}`);

    let success = false;
    let message = "";

    try {
        switch (cmd.type) {
            case 'ARM':
                success = simulator.arm();
                message = success ? "Drone Armed" : "Failed to Arm (Check Battery/State)";
                break;
            case 'DISARM':
                success = simulator.disarm();
                message = "Drone Disarmed";
                break;
            case 'TAKEOFF':
                success = simulator.takeoff(cmd.param1 || 10); // Default 10m
                message = success ? "Taking Off" : "Failed to Takeoff (Not Armed?)";
                break;
            case 'LAND':
                success = simulator.land();
                message = "Landing Initiated";
                break;
            case 'START_MISSION':
                success = simulator.startMission();
                message = success ? "Mission Started" : "Cannot Start Mission";
                break;
            case 'RETURN_TO_HOME':
                success = simulator.returnToHome();
                message = "Returning to Home";
                break;
            case 'GOTO':
                // param2 = lat, param3 = lon
                success = simulator.goto(cmd.param2, cmd.param3);
                message = success ? "Intercepting Target!" : "Cannot Goto (Not Flying?)";
                break;
            default:
                message = "Unknown Command";
        }
    } catch (e) {
        message = e.message;
    }

    callback(null, { success, message });
}

// --- Start gRPC Server ---
const server = new grpc.Server();
server.addService(droneProto.DroneService.service, { SendCommand: sendCommand });
server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`[gRPC] Server running at 0.0.0.0:${GRPC_PORT}`);
});

// --- Start WebSocket Server ---
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`[WS] Server running at 0.0.0.0:${WS_PORT}`);

wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.on('close', () => console.log('[WS] Client disconnected'));
});

// --- Simulation Loop & Telemetry Broadcast ---
setInterval(() => {
    simulator.update(0.1); // 100ms dt

    const telemetry = simulator.getTelemetry();

    const data = JSON.stringify(telemetry);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}, 100);

// --- REST Gateway (Express) ---
// This acts as a gRPC-Gateway, allowing the frontend to call gRPC methods via JSON/HTTP
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Internal gRPC Client to talk to the server (Self-talk)
const client = new droneProto.DroneService(`localhost:${GRPC_PORT}`, grpc.credentials.createInsecure());

app.post('/api/command', (req, res) => {
    const { type, param1, param2, param3 } = req.body;

    // Map string command to enum if necessary, or pass as is if protoLoader handles it
    client.SendCommand({ type, param1, param2, param3 }, (err, response) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(response);
        }
    });
});

const HTTP_PORT = 3001;
app.listen(HTTP_PORT, () => {
    console.log(`[Gateway] REST Gateway running at http://localhost:${HTTP_PORT}`);
});
