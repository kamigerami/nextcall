# Prompt Eval Report

- Generated: 2026-04-15T09:26:16.232Z
- Model: gpt-5.4-mini
- Judge model: gpt-5.4-mini
- Judge enabled: yes
- Case filter: initial-07

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

### initial-07 (initial)

- Final status: pass
- Rejected before model: no
- Expected rejection: no
- Unexpected rejection: no
- Deterministic tags: none

Input:
```json
{
  "mode": "initial",
  "idea": "AI tool that turns YouTube videos into short clips automatically"
}
```

Output:
```json
{
  "assessment": {
    "verdict": "weak",
    "reason": "This is a crowded, generic idea with shallow pain. Everyone knows the task, and most people already have some workaround. “Auto clipper” is not a problem statement; it’s a feature description."
  },
  "best_angle": {
    "title": "Clip long podcasts for growth teams chasing distribution",
    "description": "Position it for creators and marketing teams that need 10–30 usable social clips from one long video fast, because they have deadlines and repurposing quotas. That gives real urgency and a budget."
  },
  "other_angles": [
    "Turn customer webinars into clips for sales and demand gen teams",
    "Turn expert interviews into clips for creators who publish daily and need volume"
  ],
  "hooks": [
    "I need clips, not another editing project.",
    "One video should feed the week.",
    "If clipping takes an hour, you won’t do it.",
    "Most videos die as one upload.",
    "The problem is not making content. It’s pulling the good bits out."
  ],
  "test": {
    "what_to_do": "Send a direct message to 20 creators, podcast editors, and content marketers offering to turn one recent long-form video into 10 short clips by hand in 24 hours. Ask if they would pay for that every week if the clips are actually usable.",
    "where": [
      "LinkedIn",
      "X",
      "creator communities"
    ],
    "artifact_type": "dm",
    "artifact_text": "Saw your recent video/interview. I’m testing a service that turns one long video into 10 short clips in 24 hours. Not asking you to buy software — just want to know if this is something you’d pay for weekly if the clips are actually usable. Want me to do one for your latest video?"
  },
  "next_step": {
    "instruction": "Narrow it to one buyer with a budget and a deadline, then test willingness to pay before building anything.",
    "why": "The broad ‘YouTube to clips’ market is saturated. You only find a real business if you tie it to a specific workflow and someone who needs the output now."
  }
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
Reason: The output makes a clear weak call, explicitly flags crowdedness, and gives a concrete next test aimed at a narrower buyer with urgency. It’s sharper than generic advice and not just a rewrite of the idea.
Biggest problem: The test is still a bit optimistic because DM outreach to creators may produce polite interest rather than real payment signals, and the angle could be narrowed even further.
One fix: Swap the DM ask for a higher-friction signal, like offering a paid pilot or asking for a specific budget range before doing the clips.

Attempts:
- initial: ok
```text
{"assessment":{"verdict":"weak","reason":"This is a crowded, generic idea with shallow pain. Everyone knows the task, and most people already have some workaround. “Auto clipper” is not a problem statement; it’s a feature description."},"best_angle":{"title":"Clip long podcasts for growth teams chasing distribution","description":"Position it for creators and marketing teams that need 10–30 usable social clips from one long video fast, because they have deadlines and repurposing quotas. That gives real urgency and a budget."},"other_angles":["Turn customer webinars into clips for sales and demand gen teams","Turn expert interviews into clips for creators who publish daily and need volume"],"hooks":["I need clips, not another editing project.","One video should feed the week.","If clipping takes an hour, you won’t do it.","Most videos die as one upload.","The problem is not making content. It’s pulling the good bits out."],"test":{"what_to_do":"Send a direct message to 20 creators, podcast editors, and content marketers offering to turn one recent long-form video into 10 short clips by hand in 24 hours. Ask if they would pay for that every week if the clips are actually usable.","where":["LinkedIn","X","creator communities"],"artifact_type":"dm","artifact_text":"Saw your recent video/interview. I’m testing a service that turns one long video into 10 short clips in 24 hours. Not asking you to buy software — just want to know if this is something you’d pay for weekly if the clips are actually usable. Want me to do one for your latest video?"},"next_step":{"instruction":"Narrow it to one buyer with a budget and a deadline, then test willingness to pay before building anything.","why":"The broad ‘YouTube to clips’ market is saturated. You only find a real business if you tie it to a specific workflow and someone who needs the output now."}}
```

