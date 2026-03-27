#!/bin/bash

# ApartmentAgent - Install All Agent Skills
# Run this script to install all required agent skills for the hackathon project

echo "🚀 Installing Agent Skills for ApartmentAgent..."
echo ""

# Auth0 authentication patterns
echo "📦 Installing Auth0 agent skills..."
npx skills add auth0/agent-skills
echo "✅ Auth0 skills installed"
echo ""

# Airbyte agent connectors
echo "📦 Installing Airbyte agent connectors..."
npx skills add airbytehq/airbyte-agent-connectors
echo "✅ Airbyte skills installed"
echo ""

# Bland AI voice agent patterns
echo "📦 Installing Bland AI skills via Shipables..."
npx @senso-ai/shipables install spencerjsmall/bland-ai
echo "✅ Bland AI skills installed"
echo ""

echo "🎉 All agent skills installed successfully!"
echo ""
echo "Next steps:"
echo "1. Install Ghost CLI: curl -fsSL https://install.ghost.build | sh"
echo "2. Create database: ghost create --name apartment-agent-db"
echo "3. Install Python deps: pip install -r requirements.txt"
echo "4. Copy .env.example to .env and add your API keys"
echo ""
echo "Ready to build! 🏗️"
