#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONGODB_PORT=27017
BACKEND_PORT=3001
FRONTEND_PORT=5173
DB_NAME="globe-io"

echo -e "${BLUE}🌍 Globe.io Bootstrap Script${NC}"
echo -e "${BLUE}================================${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to check if MongoDB is running
check_mongodb() {
    if port_in_use $MONGODB_PORT; then
        return 0
    else
        return 1
    fi
}

# Function to check if database exists and has data
check_database_exists() {
    if command_exists mongosh; then
        MONGO_CMD="mongosh"
    elif command_exists mongo; then
        MONGO_CMD="mongo"
    else
        return 1
    fi

    COUNT=$($MONGO_CMD --quiet --eval "db.getSiblingDB('$DB_NAME').cities.countDocuments()" 2>/dev/null)
    if [ "$COUNT" -gt 0 ] 2>/dev/null; then
        echo -e "${GREEN}✅ Database '$DB_NAME' exists with $COUNT cities${NC}"
        return 0
    else
        return 1
    fi
}

# Function to start MongoDB
start_mongodb() {
    echo -e "${YELLOW}📦 Starting MongoDB...${NC}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew services start mongodb-community >/dev/null 2>&1
            sleep 3
        else
            mongod --fork --logpath /usr/local/var/log/mongodb/mongo.log --dbpath /usr/local/var/mongodb
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongod
        sleep 2
    else
        echo -e "${RED}❌ Unsupported OS for automatic MongoDB start${NC}"
        echo -e "${YELLOW}Please start MongoDB manually and run this script again${NC}"
        exit 1
    fi

    if check_mongodb; then
        echo -e "${GREEN}✅ MongoDB started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start MongoDB${NC}"
        return 1
    fi
}

# Function to seed database
seed_database() {
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    cd server && npm run seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
        cd ..
        return 0
    else
        echo -e "${RED}❌ Failed to seed database${NC}"
        cd ..
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi

    if [ ! -d "server/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
        cd server && npm install && cd ..
    fi
}

# Main Script

# 1. Check for required commands
echo -e "${BLUE}🔍 Checking requirements...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

if ! command_exists mongod && ! command_exists brew; then
    echo -e "${RED}❌ MongoDB is not installed${NC}"
    echo -e "${YELLOW}Please install MongoDB:${NC}"
    echo -e "  macOS: brew install mongodb-community"
    echo -e "  Linux: sudo apt-get install mongodb"
    exit 1
fi

echo -e "${GREEN}✅ All requirements met${NC}\n"

# 2. Install dependencies
install_dependencies

# 3. Check MongoDB status
echo -e "${BLUE}🔍 Checking MongoDB status...${NC}"

if check_mongodb; then
    echo -e "${GREEN}✅ MongoDB is already running${NC}"
else
    if ! start_mongodb; then
        echo -e "${RED}❌ Could not start MongoDB${NC}"
        echo -e "${YELLOW}Please start MongoDB manually:${NC}"
        echo -e "  macOS: brew services start mongodb-community"
        echo -e "  Linux: sudo systemctl start mongod"
        exit 1
    fi
fi

# 4. Check if database needs seeding
echo -e "\n${BLUE}🔍 Checking database...${NC}"

if ! check_database_exists; then
    echo -e "${YELLOW}⚠️  Database not found or empty${NC}"
    if ! seed_database; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Database is ready${NC}"
fi

# 5. Check if backend is already running
echo -e "\n${BLUE}🔍 Checking backend server...${NC}"

if port_in_use $BACKEND_PORT; then
    echo -e "${GREEN}✅ Backend server is already running on port $BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}🚀 Starting backend server...${NC}"
    cd server && npm start > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 3

    if port_in_use $BACKEND_PORT; then
        echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        exit 1
    fi
    cd ..
fi

# 6. Check if frontend is already running
echo -e "\n${BLUE}🔍 Checking frontend server...${NC}"

if port_in_use $FRONTEND_PORT; then
    echo -e "${GREEN}✅ Frontend server is already running on port $FRONTEND_PORT${NC}"
    echo -e "\n${GREEN}🎉 All systems operational!${NC}"
    echo -e "${BLUE}🌍 Open http://localhost:$FRONTEND_PORT in your browser${NC}"
else
    echo -e "${YELLOW}🚀 Starting frontend server...${NC}"
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 3

    if port_in_use $FRONTEND_PORT; then
        echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
        echo -e "\n${GREEN}🎉 Bootstrap complete!${NC}"
        echo -e "${BLUE}🌍 Open http://localhost:$FRONTEND_PORT in your browser${NC}"
        echo -e "\n${YELLOW}💡 To stop the servers:${NC}"
        echo -e "   kill $BACKEND_PID $FRONTEND_PID"
    else
        echo -e "${RED}❌ Failed to start frontend server${NC}"
        exit 1
    fi
fi

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}Ready to explore the globe! 🌍${NC}"
