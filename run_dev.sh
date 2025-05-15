#!/bin/bash

# Title: Binventory Development Environment Launcher
# Description: This script runs both the frontend and backend development servers for local development

# Display intro banner
echo "
╔══════════════════════════════════════════╗
║       BINVENTORY - DEVELOPMENT MODE      ║
╚══════════════════════════════════════════╝
"

# Kill any existing processes on the dev ports if they exist
echo "Checking for existing processes on ports 3000 and 8000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start a new tmux session if not already in one
if [ -z "$TMUX" ]; then
    # Check if tmux is installed
    if ! command -v tmux &> /dev/null; then
        echo "tmux is not installed. Running in split terminal mode instead."
        
        # Use two terminals instead
        echo "Starting backend server on port 8000..."
        cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        
        echo "Starting frontend server on port 3000..."
        cd frontend && npm run dev &
        FRONTEND_PID=$!
        
        # Setup trap to ensure both processes are killed on exit
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
        
        # Keep script running until Ctrl+C
        echo "Development servers are running. Press Ctrl+C to stop both servers."
        wait
    else
        # Create a new tmux session
        SESSION_NAME="binventory-dev"
        tmux new-session -d -s "$SESSION_NAME"
        
        # Split the window horizontally
        tmux split-window -h -t "$SESSION_NAME"
        
        # Start the backend server in the left pane
        tmux send-keys -t "${SESSION_NAME}.0" "cd $(pwd)/backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" C-m
        
        # Start the frontend server in the right pane
        tmux send-keys -t "${SESSION_NAME}.1" "cd $(pwd)/frontend && npm run dev" C-m
        
        # Attach to the session
        echo "Starting development servers in tmux session '$SESSION_NAME'..."
        tmux attach-session -t "$SESSION_NAME"
    fi
else
    # Already in a tmux session, just split the window
    tmux split-window -h
    tmux select-pane -t 0
    tmux send-keys "cd $(pwd)/backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" C-m
    tmux select-pane -t 1
    tmux send-keys "cd $(pwd)/frontend && npm run dev" C-m
fi

# This point is only reached when not using tmux or when the tmux session ends
echo "Development servers stopped."
