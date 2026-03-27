# Agent Skills Quick Reference

## Installed Skills

### 1. Auth0 Agent Skills
**Install**: `npx skills add auth0/agent-skills`

**What it provides**:
- Production-ready authentication patterns
- Calendar OAuth for Google/Outlook
- Multi-tenant API security
- Token management

**Use in prompts**:
- "Set up Auth0 authentication for Express"
- "Add calendar OAuth to the booking system"
- "Implement multi-tenant API security"

**Skills included**:
- `auth0-quickstart`: Framework detection
- `auth0-express`: Express.js patterns
- `auth0-mfa`: Multi-factor auth
- `auth0-migration`: Migration guidance

---

### 2. Airbyte Agent Connectors
**Install**: `npx skills add airbytehq/airbyte-agent-connectors`

**What it provides**:
- Real-time CDC patterns
- Agent connector setup
- Direct mode for live queries
- MCP integration

**Use in prompts**:
- "Set up Airbyte CDC for Zillow listings"
- "Configure real-time listing ingestion"
- "Create agent connector for Apartments.com"

**Documentation**: https://docs.airbyte.com/ai-agents

---

### 3. Bland AI (via Shipables)
**Install**: `npx @senso-ai/shipables install spencerjsmall/bland-ai`

**What it provides**:
- Voice agent configuration
- Pathways for conditional logic
- Webhook patterns
- Multi-agent orchestration
- Error handling

**Use in prompts**:
- "Create a Bland AI pre-screen agent"
- "Set up pathways for conditional call logic"
- "Configure webhook for transcript analysis"
- "Implement voicemail handling"

**Documentation**: https://shipables.dev

---

## Quick Start

Run the install script:
```bash
./install-skills.sh
```

Or install manually:
```bash
npx skills add auth0/agent-skills
npx skills add airbytehq/airbyte-agent-connectors
npx @senso-ai/shipables install spencerjsmall/bland-ai
```

## Verification

Check installed skills:
```bash
npx skills list
```

Should show:
- ✅ auth0/agent-skills
- ✅ airbytehq/airbyte-agent-connectors  
- ✅ spencerjsmall/bland-ai

## Using Skills

Once installed, your AI assistant automatically uses these patterns. Just ask naturally:

**Authentication**:
- "Add Auth0 login to the Express app"
- "Set up calendar OAuth for booking viewings"

**Data Ingestion**:
- "Configure Airbyte to monitor Zillow listings"
- "Set up CDC for real-time listing updates"

**Voice Agents**:
- "Create a Bland AI agent that asks about pet policy"
- "Set up conditional pathways for the pre-screen call"
- "Handle voicemail and retry logic"

The AI will generate production-ready code using the installed skills.

## Troubleshooting

**Skills not found**:
```bash
npm install -g @agentskills/cli
npx skills add auth0/agent-skills --force
```

**Shipables fails**:
```bash
npm install -g @senso-ai/shipables
shipables install spencerjsmall/bland-ai
```

**Skills not available in AI**:
- Restart your AI coding assistant
- Check `~/.skills/` directory exists
- Verify `skills.json` in project root
