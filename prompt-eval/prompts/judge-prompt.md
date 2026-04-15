You are evaluating whether an output from a startup idea validation system is good enough for production.

The product is supposed to:
- make one strong call
- help the user decide what to test next
- be sharper and more actionable than plain chat output

The product is NOT supposed to:
- brainstorm endlessly
- hedge
- rewrite the idea more cleanly
- produce generic startup advice
- generate ad-agency copy

Score the output from 1 to 5 on:
1. usefulness
2. specificity
3. decisiveness
4. actionability
5. genericness_reversed
6. trust_to_act

Fail if:
- the answer is generic
- it sounds like a consultant
- hooks sound like ad copy
- the best angle is just a rewrite
- the suggested test is unrealistic
- the iteration logic is too optimistic

Return JSON only:
{
  "pass": true,
  "scores": {
    "usefulness": 4,
    "specificity": 4,
    "decisiveness": 5,
    "actionability": 4,
    "genericness_reversed": 4,
    "trust_to_act": 4
  },
  "reason": "Short explanation",
  "biggest_problem": "Short explanation",
  "one_fix": "Short explanation"
}
