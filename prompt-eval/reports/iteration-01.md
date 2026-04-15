# Prompt Eval Report

- Generated: 2026-04-15T09:33:50.231Z
- Model: gpt-5.4-mini
- Judge model: gpt-5.4-mini
- Judge enabled: yes
- Case filter: iteration-01

## Summary

| Metric | Value |
| --- | --- |
| Total tests | 1 |
| Passed | 1 |
| Failed | 0 |
| Pass rate | 100.0% |
| Schema failures | 0 |
| Generic failures | 0 |
| Mirrored idea failures | 0 |
| Bad hooks failures | 0 |
| Unrealistic test failures | 0 |
| Weak iteration failures | 0 |
| Overall pass | yes |

## Cases

### iteration-01 (iteration)

- Final status: pass
- Rejected before model: no
- Expected rejection: no
- Unexpected rejection: no
- Deterministic tags: none

Input:
```json
{
  "mode": "iteration",
  "idea": "AI tool that summarizes Slack conversations into action items",
  "previous_angle": "Stop losing action items in Slack",
  "result": "none",
  "notes": "Posted on LinkedIn, almost no reactions"
}
```

Output:
```json
{
  "analysis": "The angle failed. \"Stop losing action items in Slack\" is generic and broad, so LinkedIn reactions were never going to prove pain. No one reacts to a vague productivity promise. The problem is not clear enough, the user role is undefined, and the failure mode is too unspecific to trigger urgency. You need a narrower workflow where missed follow-up causes a concrete cost.",
  "new_angle": "For ops managers on fast-moving teams, the real pain is after a meeting or thread ends and nobody owns the next step. Focus on the moment a Slack thread turns into a dropped task because ownership never got assigned.",
  "hooks": [
    "Who’s actually doing this?",
    "We said we’d handle it and then it disappeared.",
    "Did this ever get assigned?"
  ],
  "next_step": "Test with a dm to 20 ops managers or team leads who live in Slack. Send one plain message asking whether they had a Slack thread or meeting in the last 7 days where an action item was dropped because no owner was assigned. Success = at least 6 confirm a real recent example and 3 ask to see a fix. Failure = fewer than 6 recent confirmations. Do not ask if they would use it."
}
```

Deterministic evaluation:
```json
{
  "pass": true,
  "blocker": false,
  "tags": [],
  "reasons": [],
  "expectedRejection": false,
  "unexpectedRejection": false
}
```

Judge: pass
Scores: usefulness 4, specificity 4, decisiveness 5, actionability 4, genericness_reversed 4, trust_to_act 4
Reason: It correctly interprets the LinkedIn silence as failure of a vague angle, narrows to a more concrete workflow, and gives a clear next test with a real threshold. It is sharper than generic startup advice and avoids optimistic language.
Biggest problem: The new angle is still a bit broad and slightly consultant-y; it names a segment but not a very specific recurring moment or trigger.
One fix: Narrow the test to one exact scenario, like ‘a Slack thread ends with no owner assigned after a meeting,’ and ask only about that one recent incident.

Attempts:
- initial: ok
```text
{"analysis":"The angle failed. 'Stop losing action items in Slack' is too generic and LinkedIn silence is a weak signal, but 'almost no reactions' still says the pain was not compelling enough to make people stop scrolling. This is a broad productivity trope, not a sharp workflow failure. Narrow to one user role and one specific failure point where the cost is real.","new_angle":"For engineering managers after a messy Slack thread: catching the one action item that never gets assigned before the team forgets it.","hooks":["Who’s actually doing this?","We talked about it in Slack and then nothing happened.","Wait, did anyone assign that or not?"],"next_step":"Test with 15 engineering managers who regularly run project threads in Slack. Send a dm or outreach_script that asks about one recent thread where a decision or task was discussed but never assigned. Success = at least 5/15 describe a real recent miss without prompting. If fewer than 5 can name a specific failure, this angle is dead."}
```
- repair: ok
```text
{"analysis":"The angle failed. \"Stop losing action items in Slack\" is generic and broad, so LinkedIn reactions were never going to prove pain. No one reacts to a vague productivity promise. The problem is not clear enough, the user role is undefined, and the failure mode is too unspecific to trigger urgency. You need a narrower workflow where missed follow-up causes a concrete cost.","new_angle":"For ops managers on fast-moving teams, the real pain is after a meeting or thread ends and nobody owns the next step. Focus on the moment a Slack thread turns into a dropped task because ownership never got assigned.","hooks":["Who’s actually doing this?","We said we’d handle it and then it disappeared.","Did this ever get assigned?"],"next_step":"Test with a dm to 20 ops managers or team leads who live in Slack. Send one plain message asking whether they had a Slack thread or meeting in the last 7 days where an action item was dropped because no owner was assigned. Success = at least 6 confirm a real recent example and 3 ask to see a fix. Failure = fewer than 6 recent confirmations. Do not ask if they would use it."}
```

