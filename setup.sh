#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Backend Setup
echo -e "${GREEN}Setting up the Python backend...${NC}"
cd backend

# Create and activate a Python virtual environment
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi
source venv/bin/activate

# Install Python dependencies
echo -e "${GREEN}Installing backend dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Start the backend server
echo -e "${GREEN}Starting the backend server...${NC}"
nohup python app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Move back to the root directory
cd ..

# Frontend Setup
echo -e "${GREEN}Setting up the React frontend...${NC}"
cd frontend

# Install Node.js dependencies
echo -e "${GREEN}Installing frontend dependencies...${NC}"
npm install

# Start the frontend server
echo -e "${GREEN}Starting the frontend server...${NC}"
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Move back to the root directory
cd ..

# Output success message
echo -e "${GREEN}Both servers are running!${NC}"
echo -e "${GREEN}Backend PID: ${BACKEND_PID}${NC}"
echo -e "${GREEN}Frontend PID: ${FRONTEND_PID}${NC}"
echo -e "${GREEN}Check backend logs: backend/backend.log${NC}"
echo -e "${GREEN}Check frontend logs: frontend/frontend.log${NC}"
