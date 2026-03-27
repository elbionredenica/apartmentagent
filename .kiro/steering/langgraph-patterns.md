---
inclusion: fileMatch
fileMatchPattern: "**/langgraph*.{py,ts}"
---

# LangGraph State Machine Patterns

## Checkpointer Setup

### With Aerospike (if using both DBs)
```python
from langgraph.checkpoint.aerospike import AerospikeCheckpointer

checkpointer = AerospikeCheckpointer(
    hosts=[("localhost", 3000)],
    namespace="apartment_agent",
    set_name="checkpoints"
)

graph = graph.compile(checkpointer=checkpointer)
```

### With Postgres/Ghost (simplified)
```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver(
    connection_string=ghost_connection_string,
    autocommit=True
)

graph = graph.compile(checkpointer=checkpointer)
```

## State Schema

Define clear state structure:

```python
from typing import TypedDict, Literal

class ListingState(TypedDict):
    listing_id: str
    user_id: str
    status: Literal[
        "discovered",
        "criteria_checked", 
        "queued_for_prescreen",
        "prescreened",
        "queued_for_deepscreen",
        "deepscreened",
        "booked",
        "failed",
        "voicemail_pending"
    ]
    failure_reason: str | None
    prescreen_transcript: str | None
    deepscreen_transcript: str | None
    scores: dict | None
    next_action: str | None
```

## Node Patterns

### Criteria Check Node
```python
def check_criteria(state: ListingState) -> ListingState:
    """Fast text-based filtering before calling"""
    listing = get_listing(state["listing_id"])
    user = get_user_profile(state["user_id"])
    
    # Check obvious dealbreakers in listing text
    if "no pets" in listing.description.lower() and user.has_pet:
        return {
            **state,
            "status": "failed",
            "failure_reason": "PETS",
            "next_action": "end"
        }
    
    # Check budget
    if listing.rent > user.max_budget:
        return {
            **state,
            "status": "failed",
            "failure_reason": "PRICE",
            "next_action": "end"
        }
    
    return {
        **state,
        "status": "queued_for_prescreen",
        "next_action": "call_prescreen"
    }
```

### Call Orchestration Node
```python
async def orchestrate_prescreen_call(state: ListingState) -> ListingState:
    """Trigger Bland AI call and wait for webhook"""
    listing = get_listing(state["listing_id"])
    user = get_user_profile(state["user_id"])
    
    # Get call script from user preferences
    script = generate_call_script(user.dealbreakers, listing.type)
    
    # Trigger Bland AI call
    call_response = await bland_client.call(
        phone_number=listing.phone,
        prompt=script,
        webhook_url=f"{WEBHOOK_BASE}/prescreen_complete",
        metadata={
            "listing_id": state["listing_id"],
            "user_id": state["user_id"]
        }
    )
    
    return {
        **state,
        "status": "prescreening",
        "call_id": call_response.call_id,
        "next_action": "wait_for_webhook"
    }
```

### Webhook Handler Node
```python
def process_prescreen_result(state: ListingState) -> ListingState:
    """Process Bland AI webhook result"""
    # This gets called when webhook fires
    transcript = state.get("prescreen_transcript")
    
    # Use Claude to analyze transcript
    analysis = analyze_transcript(transcript, state["user_id"])
    
    if analysis.outcome == "PASS":
        return {
            **state,
            "status": "queued_for_deepscreen",
            "next_action": "call_deepscreen"
        }
    else:
        return {
            **state,
            "status": "failed",
            "failure_reason": analysis.failure_reason,
            "next_action": "end"
        }
```

## Conditional Edges

```python
def route_after_prescreen(state: ListingState) -> str:
    """Decide next node based on state"""
    if state["status"] == "failed":
        return "store_failure"
    elif state["status"] == "voicemail_pending":
        return "schedule_callback"
    elif state["status"] == "queued_for_deepscreen":
        return "deepscreen_call"
    else:
        return "error_handler"

graph.add_conditional_edges(
    "process_prescreen",
    route_after_prescreen,
    {
        "store_failure": "failure_node",
        "schedule_callback": "callback_node",
        "deepscreen_call": "deepscreen_node",
        "error_handler": "error_node"
    }
)
```

## Error Handling

```python
def error_handler(state: ListingState) -> ListingState:
    """Handle unexpected errors gracefully"""
    logger.error(f"Error in workflow for {state['listing_id']}")
    
    # Store error state
    store_error(state)
    
    # Decide if retryable
    if state.get("retry_count", 0) < 3:
        return {
            **state,
            "retry_count": state.get("retry_count", 0) + 1,
            "next_action": "retry"
        }
    else:
        return {
            **state,
            "status": "failed",
            "failure_reason": "MAX_RETRIES",
            "next_action": "end"
        }
```

## Concurrent Workflows

```python
async def process_multiple_listings(listings: list[str], user_id: str):
    """Process multiple listings concurrently"""
    tasks = []
    
    for listing_id in listings:
        initial_state = {
            "listing_id": listing_id,
            "user_id": user_id,
            "status": "discovered",
            "next_action": "check_criteria"
        }
        
        # Each gets its own thread_id for checkpointing
        thread_id = f"{user_id}:{listing_id}"
        
        task = graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": thread_id}}
        )
        tasks.append(task)
    
    # Run all concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Crash Recovery

```python
def resume_workflow(thread_id: str):
    """Resume a crashed workflow from last checkpoint"""
    # Checkpointer automatically loads last state
    result = graph.invoke(
        None,  # State loaded from checkpoint
        config={"configurable": {"thread_id": thread_id}}
    )
    return result
```

## Best Practices

1. **Keep nodes small**: Each node should do one thing
2. **Use type hints**: Makes debugging easier
3. **Log state transitions**: Essential for debugging
4. **Handle all edge cases**: Voicemail, wrong number, hostile landlord
5. **Test checkpointing**: Kill the process mid-workflow and verify resume works
6. **Use thread_id wisely**: Format: `{user_id}:{listing_id}` for easy lookup
