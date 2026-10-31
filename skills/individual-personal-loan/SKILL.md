---
name: individual-personal-loan
description: Explain an individual unsecured personal loan — EMI, APR, tenure, foreclosure/prepayment charges — to a rural borrower in plain Telugu, and check they understood before signing.
---

# Individual Personal Loan

## When to use this skill
The loan card is an individual (not group-liability) unsecured personal loan
from a small finance bank, NBFC, or co-operative bank: monthly EMI, a stated
APR, typically no collateral.

## Fields that matter most
- `interest_rate` — treat as APR (annual percentage rate); the card may also
  show a flat rate, which looks smaller than the real APR — use whatever is
  printed, but flag to the officer if both a flat and reducing rate appear.
- `instalment_amount` — monthly EMI, the number the borrower will recognize.
- `total_payable` vs `loan_amount` — same gap-explanation as other skills.
- `processing_fee` — often a percentage of loan_amount deducted upfront.
- `penalty` — late-payment and (if present) foreclosure/prepayment charges.

## How to explain each one (plain words, not jargon)
- **Interest rate / APR**: "ఈ అప్పుకు సంవత్సరానికి ఇంత శాతం వడ్డీ" — keep it as a
  single annual number, don't try to explain compounding.
- **EMI**: "ప్రతి నెల ఇంత రూపాయలు కట్టాలి" — monthly, not weekly, unlike the group loan skill.
- **Processing fee**: deducted upfront — borrower receives less than loan_amount.
- **Penalty / foreclosure**: state any early-closure charge if printed, since
  borrowers often assume they can repay early for free.

## Question templates
See `questions.json`.

## Grading rules
Same numeric tolerance (~5%) as other skills; accept Telugu numeral words.

## Red flags to surface to the officer
- `interest_rate` > 30% per annum for an unsecured personal loan.
- `processing_fee` > 3% of `loan_amount`.
