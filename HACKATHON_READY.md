# 🚀 ApartmentAgent - Hackathon Ready

## ✅ Complete Setup Checklist

### Development Environment
- [x] Spec created (.kiro/specs/apartment-agent-core/requirements.md)
- [x] Steering files configured (Fair Housing, LangGraph, Bland AI)
- [x] Skills documented (Ghost, Auth0, Airbyte, Bland AI)
- [x] Hooks configured (compliance checks, auto-testing, transcript storage)
- [x] MCP servers configured (Ghost database management)
- [x] Project structure (README, .env.example, .gitignore)

### Agent Skills Installation
Run this one command:
```bash
./install-skills.sh
```

Or manually:
```bash
npx skills add auth0/agent-skills
npx skills add airbytehq/airbyte-agent-connectors
npx @senso-ai/shipables install spencerjsmall/bland-ai
```

### Database Setup
```bash
curl -fsSL https://install.ghost.build | sh
ghost login
ghost create --name apartment-agent-db
```

## 🎯 Hackathon Strategy (8 Hours)

### Hour 1-3: Core Loop
**Goal**: One listing → call → transcript → storage

1. Create Ghost database schema (use `.kiro/skills/ghost-database-patterns.md`)
2. Build LangGraph orchestrator with simple state machine
3. Mock Bland AI call or use real API with test number
4. Store transcript in Ghost database

**Success metric**: Can trigger a call and see transcript in database

### Hour 4-5: Demo UI
**Goal**: Visual dashboard for judges

1. Simple web page (Flask/FastAPI + HTML)
2. Show listing cards with status
3. Stream transcript text in real-time
4. Display scores when call completes

**Success metric**: Judges can watch the agent work

### Hour 6-7: Complete Workflow
**Goal**: End-to-end demo

1. User sets preferences (form input)
2. Mock 2-3 listings appear
3. Agent calls all three
4. One passes → creates calendar event (mock or real)

**Success metric**: Full pipeline works start to finish

### Hour 8: Polish
**Goal**: Presentation ready

1. Add error handling
2. Create demo script
3. Prepare 3-minute pitch
4. Test the demo 3 times

## 🏆 Prize Targeting

### Bland AI ($500)
**What to show**: Two agents with different prompts, conditional pathways, webhook to Ghost

**Demo moment**: Show pre-screen agent ending call early when pet policy fails, then deep screen agent asking 5+ questions for a passing listing

### Airbyte ($1,750)
**What to show**: CDC pattern for real-time ingestion (even if mocked)

**Demo moment**: "New listing appears on Zillow" → agent starts calling within seconds

### Aerospike ($650)
**What to show**: LangGraph checkpointer (March 25, 2026 release)

**Demo moment**: Kill the process mid-call, restart, show it resumes from checkpoint

### Auth0 ($1,750)
**What to show**: User login, calendar OAuth, multi-tenant API

**Demo moment**: User logs in → grants calendar access → viewing auto-books to their calendar

### Overmind ($651)
**What to show**: Meta-loop concept for prompt optimization

**Demo moment**: Show analytics query: "Questions that scored high but led to rejections" → explain how this would update prompts

## 📋 Implementation Checklist

### Must Have (Core Demo)
- [ ] Ghost database with schema
- [ ] LangGraph state machine (3 states minimum)
- [ ] One Bland AI call (pre-screen or deep screen)
- [ ] Transcript storage
- [ ] Simple web UI showing status

### Should Have (Strong Demo)
- [ ] Both Bland AI agents (pre-screen + deep screen)
- [ ] Conditional pathways (end call early on dealbreaker)
- [ ] Scoring algorithm
- [ ] Auth0 login
- [ ] Calendar booking (mock or real)

### Nice to Have (Wow Factor)
- [ ] Real-time transcript streaming
- [ ] Concurrent calls (3 listings at once)
- [ ] Crash recovery demo
- [ ] Analytics query showing learning
- [ ] Fair Housing compliance check in action

## 🎬 Demo Script (3 Minutes)

### Minute 1: The Problem
"Apartment hunting is broken. You call 20 listings, half are rented, the rest have hidden dealbreakers. You waste hours on viewings that were never worth your time."

### Minute 2: The Solution
"ApartmentAgent calls for you. Watch: I set my criteria—2BR, dog-friendly, under $3K, quiet. Three listings appear. The agent calls all three simultaneously."

[Show dashboard with 3 calls starting]

"First listing: landlord says no pets. Agent ends call immediately. Second listing: voicemail, agent schedules retry. Third listing: passes pre-screen, agent does deep dive—asks about maintenance, noise, rent increases. Scores 85/100. Auto-books to my calendar."

[Show calendar event created]

### Minute 3: The Tech
"Five-stage pipeline: Airbyte CDC for real-time ingestion, LangGraph orchestration with crash recovery, two Bland AI agents with conditional logic, Ghost database with unlimited forks for testing, Auth0 for secure calendar access. Fair Housing compliant—never asks discriminatory questions."

"This is agentic AI: handles ambiguity, recovers from errors, learns from feedback. Not a search tool—a qualification engine."

## 🔧 Quick Commands

### Development
```bash
# Start Ghost database
ghost psql <db-id>

# Run tests
pytest tests/ -v

# Start dev server
python src/main.py

# Start dashboard
python src/dashboard.py
```

### Debugging
```bash
# View Ghost logs
ghost logs <db-id>

# Check database schema
ghost schema <db-id>

# List all databases
ghost list

# Fork for testing
ghost fork <db-id> --name test-db
```

## 📚 Key Files Reference

**Spec**: `.kiro/specs/apartment-agent-core/requirements.md`
**Database Schema**: `.kiro/skills/ghost-database-patterns.md`
**LangGraph Patterns**: `.kiro/steering/langgraph-patterns.md`
**Bland AI Setup**: `.kiro/skills/bland-ai-voice-agents.md`
**Auth0 Setup**: `.kiro/skills/auth0-authentication.md`
**Compliance Rules**: `.kiro/steering/fair-housing-compliance.md`

## 🆘 If Things Break

### Database issues
```bash
ghost delete <db-id>
ghost create --name apartment-agent-db
# Re-run schema setup
```

### Skills not working
```bash
./install-skills.sh
# Restart AI assistant
```

### Bland AI calls failing
- Check API key in .env
- Verify phone number format (+1XXXXXXXXXX)
- Test with Bland AI dashboard first

### Auth0 not working
- Verify callback URLs in Auth0 dashboard
- Check environment variables
- Test with Auth0 quickstart first

## 🎉 You're Ready!

Everything is set up. The requirements are comprehensive, the skills are installed, the patterns are documented. Now build something amazing in 8 hours.

**Good luck at RSAC 2026! 🚀**
