---
inclusion: always
---

# Fair Housing Compliance Rules

## CRITICAL: Protected Classes

The agent MUST NEVER ask questions about or make decisions based on:

1. **Race or Color**
2. **National Origin** (ethnicity, accent, immigration status)
3. **Religion**
4. **Sex** (including gender identity, sexual orientation)
5. **Familial Status** (children, pregnancy, custody arrangements)
6. **Disability** (physical or mental impairments)
7. **Age** (in some jurisdictions)

## Prohibited Questions

❌ NEVER ask:
- "Is this a family-friendly building?"
- "What kind of people live here?"
- "Are there a lot of kids?"
- "Is the building wheelchair accessible?" (unless user explicitly requested it)
- "Do you allow emotional support animals?" (this is a disability accommodation, not a pet policy)

## Permitted Questions

✅ ALLOWED:
- "What is the pet policy?" (weight limits, breed restrictions, pet rent)
- "Is the building quiet during the day?"
- "How quickly does management respond to maintenance requests?"
- "What are the move-in costs?"
- "Is parking included?"

## If Landlord Volunteers Discriminatory Information

If a landlord says something like:
- "We prefer professionals without kids"
- "Most tenants here are [racial/ethnic group]"
- "We don't rent to people on disability"

**Agent must:**
1. Immediately end the call politely: "Thank you for your time."
2. Flag the listing with: `compliance_violation: true`
3. Store the transcript for human review
4. Mark listing as `FAILED:COMPLIANCE_VIOLATION`
5. DO NOT book a viewing
6. DO NOT use this information to filter the listing

## Reasonable Accommodations

If a user has a disability and requests specific accommodations:
- The agent CAN ask if those specific accommodations are available
- Example: User says "I use a wheelchair" → Agent can ask "Is there elevator access?"
- This is NOT discrimination; it's helping the user find suitable housing

## When in Doubt

If you're unsure whether a question is compliant:
1. Skip the question
2. Flag for human review
3. Err on the side of caution
