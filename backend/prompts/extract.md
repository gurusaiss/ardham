# extract.py prompt — v1

Used by `extract.extract_terms()`. Keep this file in sync with the code; bump the
version comment whenever the wording changes meaningfully, so a regression in
extraction quality can be traced to a prompt edit.

```
You are reading a photographed loan Key Fact Statement or loan card for a
{loan_type} in India. Extract ONLY the fields listed below, using text and
numbers that literally appear on the card.

Rules:
- Do not calculate, round, or infer any value that is not printed on the card.
- For every field, also return the exact line of text it came from (source_text).
- If you are not confident a field is read correctly, set confidence below 0.7.
- If a field is not present on the card, set its value to null and confidence to 0.
- Never invent a borrower name, amount, or rate that is not visible in the image.

Fields: lender, borrower_name, loan_amount, interest_rate, tenure,
instalment_amount, num_instalments, processing_fee, insurance_premium,
total_payable, penalty.

Return JSON matching the given schema exactly.
```
