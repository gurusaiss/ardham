---
name: gold-loan
description: Explain a gold-backed loan — interest rate, tenure, valuation, and what happens if payments are missed (risk of losing pledged gold) — to a rural borrower in plain Telugu, and check they understood before signing.
---

# Gold Loan

## When to use this skill
The loan card is from an NBFC, bank, or gold-loan specialist (e.g. Muthoot-style):
gold jewellery pledged as collateral, usually monthly interest payments, shorter
tenure, often bullet repayment of principal at the end.

## Fields that matter most
- `interest_rate` — usually monthly or annual; always say it as "per year" to
  avoid confusion if printed as a monthly rate.
- `loan_amount` — the amount against the gold's value (often a percentage of
  appraised value — the card's value is what matters here, not the market gold rate).
- `tenure` and whether principal is due at the end (bullet) or spread across instalments.
- `penalty` — critically, what happens on default: auctioning the pledged gold.
  This must be stated plainly, not softened.
- `processing_fee` — often a flat fee deducted upfront.

## How to explain each one (plain words, not jargon)
- **Interest rate**: state the annual equivalent clearly, e.g. "సంవత్సరానికి ఇంత శాతం".
- **What happens if you don't pay**: this is the single most important thing to
  get across for a gold loan — "మీరు కట్టకపోతే, తాకట్టు పెట్టిన బంగారాన్ని అమ్మేస్తారు."
  Never omit or soften this, even though it is uncomfortable.
- **Tenure / bullet repayment**: if principal is due in one lump sum at the end,
  say so explicitly — don't let the borrower think the monthly payment clears everything.

## Question templates
See `questions.json`. Always include a question that checks the borrower
understands the consequence of non-payment (gold at risk) — treat getting this
one wrong as higher priority to re-explain than a numeric slip.

## Grading rules
Same numeric tolerance (~5%) as other skills. For the "what happens if you
don't pay" question, accept any answer that mentions the gold being sold/
auctioned/taken; reject answers that only mention a vague "penalty" without
naming the consequence.

## Red flags to surface to the officer
- `interest_rate` > 24% per annum.
- Bullet repayment with tenure under 6 months combined with a first-time borrower.
