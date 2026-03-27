# Installing Agent Skills for ApartmentAgent

## Quick Install (All Skills)

Run these commands to install all required agent skills:

```bash
# Auth0 authentication patterns
npx skills add auth0/agent-skills

# Airbyte agent connectors for real-time data
npx skills add airbytehq/airbyte-agent-connectors

# Bland AI voice agent patterns
npx @senso-ai/shipables install spencerjsmall/bland-ai
```

## What Each Skill Provides

### Auth0 Agent Skills
**Command**: `npx skills add auth0/agent-skills`

**Provides**:
- `auth0-quickstart`: Framework detection and routing
- `auth0-express`: Express.js authentication patterns
- `auth0-mfa`: Multi-factor authentication
- `auth0-migration`: Migration from other auth systems

**Use in ApartmentAgent**:
- User authentication and session management
- Calendar OAuth for Google Calendar/Outlook access
- Multi-tenant API security (isolate user data)
- Token management for long-lived calendar access

**Documentation**: https://auth0.com/docs/quickstart/agent-skills

### Airbyte Agent Connectors
**Command**: `npx skills add airbytehq/airbyte-agent-connectors`

**Provides**:
- Real-time CDC patterns for listing monitoring
- Agent connector setup (vs traditional batch sync)
- Direct mode for real-time API queries
- MCP server integration patterns

**Use in ApartmentAgent**:
- Monitor Zillow/Apartments.com for new listings
- Real-time ingestion within 60 seconds of posting
- Fan-out to multiple users when listing matches criteria

**Documentation**: https://docs.airbyte.com/ai-agents

### Bland AI (via Shipables)
**Command**: `npx @senso-ai/shipables install spencerjsmall/bland-ai`

**Provides**:
- Voice agent setup and configuration
- Pathways for conditional call logic
- Webhook integration patterns
- Multi-agent orchestration (pre-screen + deep screen)
- Error handling (voicemail, wrong number, hostile)

**Use in ApartmentAgent**:
- Pre-screen agent: Fast dealbreaker checks (60s calls)
- Deep screen agent: Qualitative assessment (4-6min calls)
- Adaptive questioning based on landlord responses
- Structured data extraction from transcripts

**Documentation**: https://shipables.dev

## Verification

After installation, verify skills are available:

```bash
# List installed skills
npx skills list

# Should show:
# - auth0/agent-skills
# - airbytehq/airbyte-agent-connectors
# - spencerjsmall/bland-ai
```

## Using Skills in Code

Once installed, your AI coding assistant (Kiro, Cursor, Claude Code) automatically has access to these patterns. Just ask:

- "Set up Auth0 authentication for Express"
- "Configure Airbyte CDC for Zillow listings"
- "Create a Bland AI pre-screen agent with pathways"

The AI will use the installed skills to generate production-ready code following best practices.

## Troubleshooting

### Skills not found
```bash
# Update skills CLI
npm install -g @agentskills/cli

# Reinstall skills
npx skills add auth0/agent-skills --force
```

### Shipables installation fails
```bash
# Install Shipables CLI globally
npm install -g @senso-ai/shipables

# Then install Bland AI skill
shipables install spencerjsmall/bland-ai
```

### Skills not available in AI assistant
- Restart your AI coding assistant (Kiro, Cursor, etc.)
- Check that skills are in `~/.skills/` directory
- Verify skills.json exists in project root
