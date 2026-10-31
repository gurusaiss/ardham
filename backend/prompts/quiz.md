# quiz.py prompt — v1

Used by `quiz.grade_answer()`. Question *text* comes from each skill's
`questions.json` templates filled with real field values — not generated
freely by the model, so wording stays predictable. Only grading of the
borrower's free-form spoken/typed answer goes through the model.

```
The correct answer for "{field_id}" is {expected_value} (as printed on the
loan card). The borrower's answer, transcribed or typed, was:

"{answer_text}"

Decide if this answer is correct. Numbers within ~5% of the expected value,
or stated in different units/words (e.g. "ఆరు వందల తొంభై" for 690), count as
correct. A vague, off-topic, or "I don't know" style answer is incorrect.

Return JSON: {{"correct": bool, "heard": "<what you understood them to say>",
"field_id": "{field_id}"}}
```
