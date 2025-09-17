#!/bin/bash

# Video Proctoring System - Quick Start Script
# This script helps you get the system running quickly

echo "🎯 Video Proctoring System - Quick Start"
echo "========================================"

# Check for required dependencies
echo "📋 Checking system requirements..."

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "❌ Python3 not found. Please install Python 3.x"
    exit 1
fi

# Check Node.js (optional)
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    NODE_AVAILABLE=true
else
    echo "⚠️  Node.js not found. Using Python server only."
    NODE_AVAILABLE=false
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p uploads reports

echo "🚀 Starting Video Proctoring System..."
echo ""
echo "Available options:"
echo "1. Demo Version (Standalone, no dependencies)"
echo "2. Full Version (Requires dependencies)"
echo "3. Test Page (System diagnostics)"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🎮 Starting Demo Version..."
        echo "📍 Opening: http://localhost:3000/demo.html"
        python3 start_server.py
        ;;
    2)
        if [ "$NODE_AVAILABLE" = true ]; then
            echo "🔧 Installing Node.js dependencies..."
            npm install
            echo "🚀 Starting Full Version..."
            npm run dev-all
        else
            echo "❌ Node.js required for full version"
            echo "🎮 Starting Demo Version instead..."
            python3 start_server.py
        fi
        ;;
    3)
        echo "🧪 Starting Test Page..."
        echo "📍 Opening: http://localhost:3000/test.html"
        python3 start_server.py &
        sleep 2
        open "http://localhost:3000/test.html" 2>/dev/null || echo "Please open http://localhost:3000/test.html in your browser"
        ;;
    *)
        echo "❌ Invalid option. Starting Demo Version..."
        python3 start_server.py
        ;;
esac