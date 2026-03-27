# Airbyte Agent Connectors for Real-Time Listing Ingestion

## Core Concept
Airbyte Agent Connectors are lightweight Python clients that let agents call APIs in real-time, not batch replication.

## Installation via Skills

Install Airbyte agent connector skills:

```bash
# Install from GitHub
npx skills add airbytehq/airbyte-agent-connectors
```

This provides:
- Agent connector patterns
- CDC setup for real-time monitoring
- Direct mode for real-time queries
- MCP server integration

## Python SDK Installation
```bash
pip install airbyte
```

## Agent Connector vs Traditional Connector
- **Traditional**: Batch sync every N hours to warehouse
- **Agent**: Real-time API calls triggered by agent logic

## Basic Usage

```python
from airbyte import Agent

agent = Agent()

# Enable a connector for direct mode
agent.enable_connector(
    connector_id="zillow",
    mode="direct"  # Real-time queries
)

# Agent can now query Zillow API directly
listings = agent.execute(
    connector="zillow",
    action="search_listings",
    params={
        "city": "San Francisco",
        "min_bedrooms": 2,
        "max_rent": 3000
    }
)
```

## CDC Pattern for Listing Monitoring

```python
# Subscribe to new listings
agent.subscribe(
    connector="zillow",
    entity="listings",
    filters={
        "city": "San Francisco",
        "status": "active"
    },
    callback=on_new_listing
)

def on_new_listing(listing):
    # This fires when a new listing appears
    # Fan out to all matching users
    matching_users = find_matching_users(listing)
    for user in matching_users:
        queue_screening_job(user.id, listing.id)
```

## MCP Server Integration

Airbyte provides an MCP server for agent access:

```bash
# Install MCP server
npm install -g @airbyte/mcp-server

# Start server
airbyte-mcp-server --port 3000
```

Add to mcp.json:
```json
{
  "airbyte": {
    "command": "npx",
    "args": ["@airbyte/mcp-server"],
    "env": {
      "AIRBYTE_API_KEY": "your_key"
    }
  }
}
```
