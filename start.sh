#!/bin/bash
echo "Starting TurbineOne GCS..."

# Start Backend
cd backend
node server.js &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID)"

# Wait for user to exit
read -p "Press Enter to stop..."

kill $BACKEND_PID
kill $FRONTEND_PID
echo "Stopped."
