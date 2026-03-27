# ApartmentAgent Development Environment - Setup Complete ✓

## What's Been Created

### 1. Spec Files (.kiro/specs/apartment-agent-core/)
- **requirements.md**: Comprehensive requirements document with 15 core requirements
  - User preference configuration
  - Real-time listing ingestion (Airbyte CDC)
  - Text-based pre-filtering
  - Two-tier voice screening (pre-screen + deep screen)
  - Transcript analysis and scoring
  - Viewing scheduling with Auth0
  - Fair Housing Act compliance enforcement
  - Workflow state persistence and crash recovery
  - Concurrent processing (20 listings simultaneously)
  - Voicemail and error handling
  - User feedback collection and learning
  - Transcript storage and retrieval
  - Hackathon demo workflow

### 2. Steering Files (.kiro/steering/)
Automatically included context for all development:

- **fair-housing-compliance.md**: Critical rules for Fair Housing Act compliance
  - Protected classes that must never be asked about
  - Prohibited vs permitted questions
  - Handling discriminatory information from landlords
  - Reasonable accommodation guidelines

- **langgraph-patterns.md**: LangGraph state machine patterns
  - Checkpointer setup (Aerospike or Postgres)
  - State schema definitions
  - Node patterns (criteria check, call orchestration, webhook handling)
  - Conditional edges and routing
  - Error handling and retry logic
  - Concurrent workflow management
  - Crash recovery patterns

- **bland-ai-best-practices.md**: Voice agent best practices
  - Prompt structure and persona design
  - Conversation flow patterns
  - Pathways configuration for conditional branching
  - Webhook integration
  - Extract configuration for structured data
  - Handling ambiguity and vague answers
  - Voicemail handling
  - Multi-agent coordination
  - Error recovery patterns

### 3. Skills (.kiro/skills/)
Domain-specific knowledge for implementation:

- **ghost-database-patterns.md**: Database schema design for agents
  - Complete schema for users, listings, call_transcripts, viewings
  - Agent-friendly query patterns
  - Database forking strategy for testing
  - Agent autonomy patterns (self-creating tables, updating learned preferences)
  - LLM-optimized naming conventions

- **airbyte-agent-connectors.md**: Real-time data ingestion
  - Installation via `npx skills add airbytehq/airbyte-agent-connectors`
  - Agent connector vs traditional connector differences
  - CDC pattern for listing monitoring
  - MCP server integration
  - Real-time API call patterns

- **bland-ai-voice-agents.md**: Voice agent integration
  - Installation via `npx @senso-ai/shipables install spencerjsmall/bland-ai`
  - Basic call setup
  - Multi-agent configuration (pre-screener vs deep screener)
  - Pathways for conditional logic
  - Webhook handling
  - Batch calling for concurrent processing

- **auth0-authentication.md**: Multi-tenant authentication
  - Installation via `npx skills add auth0/agent-skills`
  - User authentication with Express
  - Calendar OAuth integration
  - Multi-tenant API security
  - Token management patterns

### 4. Hooks (.kiro/hooks/)
Automated workflows triggered by events:

- **test-on-save.json**: Runs pytest when Python files are saved
- **prescreen-compliance-check.json**: Reviews call scripts for Fair Housing compliance before execution
- **post-call-storage.json**: Automatically stores transcripts to Ghost database after calls complete

### 5. MCP Configuration (.kiro/settings/mcp.json)
- **Ghost MCP**: Database lifecycle management
  - Auto-approved tools: list, status, schema, search_docs, view_skill
  - Enables agents to create/fork/query databases autonomously

### 6. Project Files
- **README.md**: Project overview and quick start guide
- **.env.example**: Template for environment variables
- **.gitignore**: Standard Python/Node gitignore

## Next Steps

### 1. Continue with Design Phase
The requirements are complete. Next, you should create the design document:

```bash
# In Kiro, say:
"Continue with the design phase for apartment-agent-core"
```

This will create:
- System architecture diagrams
- Component interactions
- Data flow diagrams
- API specifications
- Database schema details

### 2. Install Dependencies

```bash
# Install Ghost CLI
curl -fsSL https://install.ghost.build | sh
ghost login
ghost create --name apartment-agent-db

# Install Agent Skills
npx skills add auth0/agent-skills
npx skills add airbytehq/airbyte-agent-connectors
npx @senso-ai/shipables install spencerjsmall/bland-ai

# Install Python dependencies (after requirements.txt is created)
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### 3. Configure MCP Servers

The Ghost MCP is already configured. To activate it:

```bash
# Restart Kiro or reload MCP servers
# Ghost MCP will be available for database operations
```

### 4. Review Compliance Rules

Before implementing any call logic, review:
- `.kiro/steering/fair-housing-compliance.md`

The prescreen-compliance-check hook will automatically review scripts, but understanding the rules is critical.

## Hackathon Strategy

### Time Allocation (8 hours total)
1. **Core Loop** (3 hours): Airbyte mock → LangGraph → Bland AI → Ghost storage
2. **Demo UI** (2 hours): Dashboard showing live transcripts and scores
3. **One Full Workflow** (2 hours): User criteria → listing → call → booking
4. **Polish** (1 hour): Slides, demo script, error handling

### What to Build First
1. Ghost database schema (use the patterns in skills/)
2. LangGraph orchestrator with simple state machine
3. Mock Bland AI calls (or use real API with test numbers)
4. Transcript storage and analysis
5. Simple web dashboard to visualize

### What to Mock/Simplify
- Use 2-3 hardcoded listings instead of real Airbyte integration
- Implement 5 questions instead of all 20
- Skip Overmind meta-loop (just show the concept)
- Use simple scoring algorithm instead of complex ML

### Demo Moment
Show the dashboard, set criteria ("2BR, dog-friendly, under $3K, quiet"), click "Start Agent", watch 3-5 calls fire with live transcripts streaming, see scores populate, see one listing auto-book to calendar.

## Prize Targeting

Your implementation should emphasize:

1. **Bland AI ($500)**: Two distinct agents with mid-call webhooks to Aerospike/Ghost
2. **Airbyte ($1,750)**: CDC-driven real-time ingestion (even if mocked, show the pattern)
3. **Aerospike ($650)**: LangGraph checkpointer with March 25, 2026 integration
4. **Auth0 ($1,750)**: Calendar OAuth + multi-tenant API security
5. **Overmind ($651)**: Meta-loop concept for prompt tuning from outcomes

## Getting Help

All the context you need is in:
- Steering files (always included)
- Skills (activate when needed)
- Hooks (run automatically)
- Spec requirements (guide implementation)

When implementing, reference these files and Kiro will have full context.

## Questions?

Ask Kiro to:
- "Show me the database schema for users"
- "How do I set up LangGraph checkpointing?"
- "What questions can the pre-screen agent ask?"
- "How do I handle voicemail in Bland AI?"
- "Continue with the design phase"
