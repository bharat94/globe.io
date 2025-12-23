#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONGODB_PORT=27017
BACKEND_PORT=5000
FRONTEND_PORT=5173

echo -e "${BLUE}🛑 Globe.io Teardown Script${NC}"
echo -e "${BLUE}================================${NC}\n"

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to get PID for a port
get_pid_for_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t 2>/dev/null
}

# Function to stop process on port
stop_service() {
    local PORT=$1
    local NAME=$2

    if port_in_use $PORT; then
        local PID=$(get_pid_for_port $PORT)
        echo -e "${YELLOW}🛑 Stopping $NAME (PID: $PID, Port: $PORT)...${NC}"
        kill $PID 2>/dev/null

        # Wait up to 5 seconds for graceful shutdown
        for i in {1..5}; do
            if ! port_in_use $PORT; then
                echo -e "${GREEN}✅ $NAME stopped successfully${NC}"
                return 0
            fi
            sleep 1
        done

        # Force kill if still running
        if port_in_use $PORT; then
            echo -e "${YELLOW}⚠️  Force killing $NAME...${NC}"
            kill -9 $PID 2>/dev/null
            sleep 1
            if ! port_in_use $PORT; then
                echo -e "${GREEN}✅ $NAME force stopped${NC}"
            else
                echo -e "${RED}❌ Failed to stop $NAME${NC}"
                return 1
            fi
        fi
    else
        echo -e "${BLUE}ℹ️  $NAME is not running${NC}"
    fi
}

# Function to stop MongoDB (optional)
stop_mongodb() {
    echo -e "${YELLOW}🗄️  Stopping MongoDB...${NC}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            brew services stop mongodb-community >/dev/null 2>&1
            echo -e "${GREEN}✅ MongoDB stopped (data preserved)${NC}"
        else
            # Find mongod process and stop it
            MONGO_PID=$(pgrep mongod)
            if [ -n "$MONGO_PID" ]; then
                kill $MONGO_PID
                echo -e "${GREEN}✅ MongoDB stopped (data preserved)${NC}"
            else
                echo -e "${BLUE}ℹ️  MongoDB is not running${NC}"
            fi
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl stop mongod
        echo -e "${GREEN}✅ MongoDB stopped (data preserved)${NC}"
    else
        echo -e "${YELLOW}⚠️  Cannot auto-stop MongoDB on this OS${NC}"
        echo -e "${YELLOW}Please stop MongoDB manually if needed${NC}"
    fi
}

# Parse command line arguments
STOP_MONGODB=false
while getopts "m" opt; do
    case $opt in
        m)
            STOP_MONGODB=true
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            echo "Usage: $0 [-m]"
            echo "  -m    Also stop MongoDB (default: leave running)"
            exit 1
            ;;
    esac
done

# Main Teardown

echo -e "${BLUE}🔍 Checking running services...${NC}\n"

# Stop Frontend
stop_service $FRONTEND_PORT "Frontend (Vite)"
echo ""

# Stop Backend
stop_service $BACKEND_PORT "Backend (Express)"
echo ""

# Stop MongoDB (optional)
if [ "$STOP_MONGODB" = true ]; then
    stop_mongodb
    echo ""
else
    if port_in_use $MONGODB_PORT; then
        echo -e "${BLUE}ℹ️  MongoDB is still running (use -m flag to stop it)${NC}"
        echo -e "${GREEN}💾 Database data is preserved${NC}"
        echo ""
    fi
fi

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}📊 Status Summary:${NC}"
echo ""

if ! port_in_use $FRONTEND_PORT; then
    echo -e "  ${GREEN}✅${NC} Frontend: Stopped"
else
    echo -e "  ${RED}❌${NC} Frontend: Still running"
fi

if ! port_in_use $BACKEND_PORT; then
    echo -e "  ${GREEN}✅${NC} Backend: Stopped"
else
    echo -e "  ${RED}❌${NC} Backend: Still running"
fi

if port_in_use $MONGODB_PORT; then
    if [ "$STOP_MONGODB" = true ]; then
        echo -e "  ${RED}❌${NC} MongoDB: Still running (stop failed)"
    else
        echo -e "  ${BLUE}ℹ️${NC}  MongoDB: Running (intentionally kept alive)"
    fi
else
    echo -e "  ${GREEN}✅${NC} MongoDB: Stopped"
fi

echo ""
echo -e "${GREEN}💾 All data is preserved${NC}"
echo -e "${BLUE}🚀 Run 'npm start' to restart services${NC}"
echo -e "${BLUE}================================${NC}"
