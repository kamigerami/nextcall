# Prompt Eval Report

- Generated: 2026-04-15T09:10:19.355Z
- Model: gpt-5.4-mini
- Judge model: disabled
- Judge enabled: no
- Case filter: iteration-04

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

### iteration-04 (iteration)

- Final status: pass
- Rejected before model: yes
- Expected rejection: yes
- Unexpected rejection: no
- Deterministic tags: EXPECTED_REJECTION
- Validation error: Not enough context. Say what you tested and what happened.

Input:
```json
{
  "mode": "iteration",
  "idea": "AI app",
  "previous_angle": "Better productivity",
  "result": "none",
  "notes": ""
}
```

Deterministic evaluation:
```json
{
  "pass": true,
  "blocker": false,
  "tags": [
    "EXPECTED_REJECTION"
  ],
  "reasons": [
    "Expected rejection before model execution: Not enough context. Say what you tested and what happened."
  ],
  "expectedRejection": true,
  "unexpectedRejection": false
}
```

Judge: skipped

Notes:
- Rejected before model execution.

