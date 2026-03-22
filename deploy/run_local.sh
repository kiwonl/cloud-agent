#!/bin/bash

# Determine script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load .env variables if present
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# node_env가 있을 경우 PATH 업데이트
if [ -d "node_env/bin" ]; then
    export PATH="$PWD/node_env/bin:$PATH"
fi

# 1. Automatic installation of ADK toolchain
if [ ! -d "venv" ]; then
    echo "======================================"
    echo "Initializing Virtual Environment..."
    echo "======================================"
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install --index-url https://pypi.org/simple/ -r agents/requirements.txt
fi

# Kill existing servers to prevent Address already in use error
lsof -ti:8000,8080 | xargs kill -9 2>/dev/null

echo "======================================"
echo "Starting FastAPI Backend (Port 8000)..."
echo "======================================"
# Start custom Unified FastAPI Orchestrator Backend in background (serving ALL agents)
./venv/bin/uvicorn agents.server:adk_app --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

echo "======================================"
echo "Starting Frontend Server (Port 8080)..."
echo "======================================"
if [ -d "frontend" ]; then
    cd frontend
    if npm --version >/dev/null 2>&1; then
        if [ ! -d "node_modules" ]; then
            echo "Installing Frontend Dependencies..."
            npm install
        fi
        echo "🚀 Starting Vite Dev Server..."
        npm run dev -- --port 8080 &
    else
        echo "⚠️  npm not found in PATH. Falling back to Static HTTP Server..."
        if [ -d "dist" ]; then
            echo "Serving compiled production build from dist/..."
            cd dist
            python3 -m http.server 8080 &
            FRONTEND_PID=$!
            cd ..
        else
            python3 -m http.server 8080 &
            FRONTEND_PID=$!
        fi
    fi
    cd ..
else
    echo "⚠️  Warning: 'frontend' directory not found. Skipping frontend server."
    FRONTEND_PID=""
fi

echo ""
echo "✅ Local Environment Running!"
echo "🌐 Frontend: http://localhost:8080"
echo "⚙️ Backend : http://localhost:8000"
echo "🛑 Press Ctrl+C to stop both servers."
echo ""

# Trap Ctrl+C to kill background processes safely
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID 2>/dev/null; [ -n \"$FRONTEND_PID\" ] && kill $FRONTEND_PID 2>/dev/null; exit" INT
wait
