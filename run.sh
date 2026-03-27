#!/bin/bash

# ApartmentAgent Backend - Quick Start Script

echo "🚀 Starting ApartmentAgent Backend..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Copy .env.example to .env and add your API keys"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Start Aerospike if not running
if ! docker ps | grep -q aerospike; then
    echo "🐳 Starting Aerospike..."
    docker-compose up -d aerospike
    echo "⏳ Waiting for Aerospike to be ready..."
    sleep 5
fi

# Start the server
echo ""
echo "✅ Starting FastAPI server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
