# ApartmentAgent

AI agent that calls apartment listings on your behalf, asks your specific questions, and only schedules viewings worth your time.

## The Problem
Apartment hunting is a full-time job. You call listings to find half are rented, and available ones have unlisted dealbreakers you only discover after wasting time at viewings.

## The Solution
Tell the agent your requirements. It monitors listings, calls property managers, asks your questions, filters ruthlessly, and only books viewings that pass all checks.

## Architecture

### Five-Stage Pipeline
1. **Ingestion** (Airbyte) - Real-time listing monitoring with CDC
2. **Planning** (LangGraph + Ghost/Aerospike) - Orchestration and state management
3. **Pre-screen** (Bland AI Agent 1) - Fast dealbreaker checks (60s)
4. **Deep screen** (Bland AI Agent 2) - Qualitative assessment (4-6min)
5. **Booking** (Auth0 + Calendar) - Secure scheduling with OAuth

### Tech Stack
- **Airbyte**: CDC-driven listing ingestion
- **LangGraph**: Agentic workflow orchestration
- **Ghost**: Postgres database with unlimited forks
- **Aerospike** (optional): Sub-ms state machine for concurrency
- **Bland AI**: Voice agents with conditional pathways
- **Auth0**: Multi-tenant auth and calendar OAuth
- **AWS Bedrock**: Claude for transcript analysis
- **Overmind**: Continuous prompt optimization

## Quick Start

### Prerequisites
```bash
# Install Ghost CLI
curl -fsSL https://install.ghost.build | sh

# Authenticate
ghost login

# Create database
ghost create --name apartment-agent-db
```

### Installation
```bash
# Clone repo
git clone <repo-url>
cd apartmentagent

# Install agent skills
npx skills add auth0/agent-skills
npx skills add airbytehq/airbyte-agent-connectors
npx @senso-ai/shipables install spencerjsmall/bland-ai

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Run
```bash
# Start the agent
python src/main.py

# Or use the web dashboard
python src/dashboard.py
```

## Development Setup

### Kiro Integration
This project uses Kiro for agentic development:

- **Specs**: See `.kiro/specs/` for feature specifications
- **Steering**: Fair Housing compliance rules in `.kiro/steering/`
- **Skills**: Database patterns, LangGraph, Bland AI in `.kiro/skills/`
- **Hooks**: Auto-compliance checks and test running in `.kiro/hooks/`

### MCP Servers
Ghost MCP is configured for database management:
```bash
# List databases
ghost list

# Get connection string
ghost connect <db-id>

# Fork for testing
ghost fork <db-id> --name test-db
```

## Fair Housing Compliance

This agent strictly adheres to Fair Housing Act requirements:
- Never asks about protected classes (race, religion, familial status, disability, etc.)
- Flags and reports discriminatory statements from landlords
- All call scripts reviewed for compliance before execution

See `.kiro/steering/fair-housing-compliance.md` for full rules.

## License
MIT
