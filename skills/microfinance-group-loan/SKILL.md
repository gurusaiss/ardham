---
name: microfinance-group-loan
description: Explain a Joint Liability Group (JLG) microfinance loan — weekly instalments, reducing-balance interest, group liability — to a first-time rural borrower in plain Telugu, and check they understood the key numbers before signing.
---

# Microfinance Group Loan (JLG)

## When to use this skill
The loan card is from an NBFC-MFI or bank's Joint Liability Group product: weekly
or fortnightly instalments, a small group of borrowers (usually women), no
collateral, interest charged on a reducing balance.

## Fields that matter most
- `instalment_amount` and its frequency (weekly, almost always) — this is what the
  borrower actually feels every week.
- `total_payable` vs `loan_amount` — the gap is interest + fees + insurance.
- `processing_fee` and `insurance_premium` — commonly deducted upfront, so the
  borrower receives less than `loan_amount` in hand. Always call this out.
- `num_instalments` — confirms the loan's real duration in weeks/months.
- `penalty` — late-payment charge per missed instalment.

## How to explain each one (plain words, not jargon)
- **Interest rate**: "ఈ డబ్బు వాడుకున్నందుకు ప్రతి సంవత్సరం ఇంత శాతం అదనంగా కడతారు" —
  don't explain reducing-balance math, just that it's a yearly rate on what's left owed.
- **Instalment**: frame as "ప్రతి వారం ఇంత రూపాయలు కట్టాలి", never as a lump sum.
- **Processing fee / insurance**: explicitly say this is deducted upfront and the
  borrower gets less cash in hand than the sanctioned amount.
- **Total payable**: frame as "మొత్తం మీద ఇంత కడతారు" — the full amount across all
  instalments, so they can compare it to the loan amount received.
- **Penalty**: state as a per-missed-instalment charge, not a scary lump sum.

## Question templates
See `questions.json`. Always ask about `instalment_amount` and `total_payable`
first — if the borrower gets those two right, comprehension risk is low.

## Grading rules
Accept numeric answers within ~5% of the printed value, and accept Telugu
numeral words as equivalent to digits. Reject vague answers ("whatever they
said", silence, "I'll ask my husband") as incorrect — re-explain that field.

## Red flags to surface to the officer (not hidden from them)
- `interest_rate` > 26% per annum (flag only, don't block).
- `processing_fee` + `insurance_premium` > 15% of `loan_amount`.
- `total_payable` / `loan_amount` > 1.5 for a loan under 60 weeks.
