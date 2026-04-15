# Prompt Eval Report

- Generated: 2026-04-15T09:16:41.939Z
- Model: gpt-5.4-mini
- Judge model: gpt-5.4-mini
- Judge enabled: yes
- Case filter: initial-05

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

### initial-05 (initial)

- Final status: pass
- Rejected before model: yes
- Expected rejection: yes
- Unexpected rejection: no
- Deterministic tags: EXPECTED_REJECTION
- Validation error: This reads like buzzwords, not a problem. Make it concrete.

Input:
```json
{
  "mode": "initial",
  "idea": "AI powered platform for scalable intelligent workflow automation across distributed teams"
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
    "Expected rejection before model execution: This reads like buzzwords, not a problem. Make it concrete."
  ],
  "expectedRejection": true,
  "unexpectedRejection": false
}
```

Judge: skipped

Notes:
- Rejected before model execution.

