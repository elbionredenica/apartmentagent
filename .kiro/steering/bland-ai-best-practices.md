---
inclusion: fileMatch
fileMatchPattern: "**/bland*.{py,ts,js}"
---

# Bland AI Voice Agent Best Practices

## Prompt Structure

### Agent Persona
- Keep it professional but friendly
- Use first person: "I'm calling about..." not "The system is calling..."
- Identify purpose immediately: "I'm calling on behalf of a client looking for an apartment"

### Conversation Flow
1. **Opening** (5 seconds): State purpose, confirm availability
2. **Qualification** (30-60 seconds): Ask dealbreaker questions first
3. **Deep dive** (2-4 minutes): Qualitative questions if passed initial screen
4. **Closing** (5 seconds): Thank them, confirm next steps

## Pathways Configuration

### Conditional Branching
Use `conditional_node` to check real-time data:

```python
{
  "type": "conditional",
  "condition": "webhook_response.pet_policy == 'no_pets'",
  "if_true": "end_call_politely",
  "if_false": "continue_to_noise_question"
}
```

### Webhook Integration
- Fire webhooks at decision points, not after every sentence
- Include `call_id`, `listing_id`, `user_id` in every webhook
- Expect 200ms response time, have fallback if timeout

## Extract Configuration

Define structured data extraction:

```json
{
  "extract": {
    "available": "boolean",
    "pet_policy": "string",
    "pet_weight_limit": "number",
    "noise_level": "enum[quiet,moderate,loud]",
    "rent_includes_utilities": "boolean",
    "maintenance_response": "enum[excellent,good,fair,poor]"
  }
}
```

## Handling Ambiguity

### Landlord gives vague answer
❌ Bad: Accept it and move on
✅ Good: Probe for specifics

Example:
- Landlord: "It depends on the dog"
- Agent: "Just to clarify — is there a specific weight limit, or is it case-by-case based on breed?"

### Landlord doesn't know
- Don't push too hard (max 1 follow-up)
- Mark as `UNKNOWN` in extract
- Let LangGraph decide if it's a dealbreaker

## Voicemail Handling

If voicemail detected:
1. Leave brief message: "Hi, I'm calling about the 2-bedroom on [street]. Please call back at [number]."
2. Fire webhook with `outcome: "voicemail"`
3. Schedule callback check in 2 hours

## Multi-Agent Coordination

### Agent 1 (Pre-screener)
- Goal: Fast disqualification (60 seconds max)
- Questions: 3-5 dealbreakers only
- Tone: Efficient, polite

### Agent 2 (Deep screener)
- Goal: Qualitative assessment (4-6 minutes)
- Questions: 10-15 detailed questions
- Tone: Conversational, thorough

### Handoff
- Don't mention "another agent will call"
- Agent 2 should reference Agent 1's call: "I spoke with you earlier about the pet policy..."

## Error Recovery

### Landlord is hostile
- End call immediately: "I apologize for the inconvenience. Have a good day."
- Mark: `outcome: "hostile"`

### Wrong number
- Apologize and end: "I'm sorry, I must have the wrong number."
- Mark: `outcome: "wrong_number"`

### Language barrier
- If landlord doesn't speak English well, offer to call back with translator
- Mark: `outcome: "language_barrier"`

## Testing

Before deploying a new agent:
1. Test with 5 mock calls (friendly, hostile, vague, voicemail, wrong number)
2. Verify extract fields are populated correctly
3. Check webhook payloads are complete
4. Confirm call duration is within expected range
