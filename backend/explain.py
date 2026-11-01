"""LoanTerms + skill -> short Telugu explanation sentences, one term at a time.

Every sentence is generated and then passed through guard.filter_explanation()
before it ever reaches the frontend — this module never returns unvalidated text.
"""
from __future__ import annotations

from guard import filter_explanation
from model_client import GemmaClient
from schemas import ExplanationSentence, LoanTerms
from skills_loader import Skill

_PROMPT_TEMPLATE = (
    "You are explaining one line item of a loan to a rural borrower in pure, simple, "
    "spoken Telugu. Use short, clear sentences that a rural person can follow immediately.\n\n"
    "Field: {field_id}\n"
    "Value as printed on the card: {value}\n"
    'Exact source line: "{source_text}"\n'
    "Plain-word glossary for this term: {glossary_entry}\n\n"
    "Rules:\n"
    "- Strictly use pure Telugu vocabulary (ఆంధ్ర/తెలంగాణ వాడుక భాష). NEVER use Hindi words (do NOT use కిష్త్, కర్జ్, బ్యాజ్, జుర్మానా). Use pure Telugu financial terms: అప్పు (loan), వడ్డీ (interest), వాయిదా (instalment), రుసుము (fee), మొత్తం (total), అపరాధ రుసుము (penalty).\n"
    "- Keep numbers in clear standard digits (e.g. 50,000, 690, 24, 18%) so they are spoken clearly by speech synthesis.\n"
    "- Use ONLY the value given above. Never state a different number.\n"
    "- One or two short, crisp sentences in pure Telugu.\n"
    "- Do not add advice, opinions, or warnings — state the fact plainly.\n"
    "- Reply with nothing but the sentence itself."
)

# Fields worth explaining to the borrower, in the order they should hear them.
EXPLAIN_FIELD_ORDER = [
    "loan_amount",
    "interest_rate",
    "instalment_amount",
    "num_instalments",
    "processing_fee",
    "insurance_premium",
    "total_payable",
    "penalty",
]


EXPLAIN_TEMPLATES: dict[str, dict[str, str]] = {
    "loan_amount": {
        "te": "మీకు మంజూరైన లోన్ మొత్తం {value} రూపాయలు.",
        "en": "Your sanctioned loan amount is {value} rupees.",
        "hi": "आपकी स्वीकृत ऋण राशि {value} रुपये है।",
    },
    "instalment_amount": {
        "te": "మీరు ప్రతి వాయిదాకి {value} రూపాయలు చెల్లించాలి.",
        "en": "You need to pay an installment of {value} rupees each cycle.",
        "hi": "आपको प्रत्येक किस्त में {value} रुपये का भुगतान करना होगा।",
    },
    "interest_rate": {
        "te": "మీ లోన్ వార్షిక వడ్డీ రేటు {value} శాతం.",
        "en": "The annual interest rate on your loan is {value} percent.",
        "hi": "आपके ऋण पर वार्षिक ब्याज दर {value} प्रतिशत है।",
    },
    "num_instalments": {
        "te": "ఈ రుణం మొత్తం {value} వాయిదాలలో చెల్లించాలి.",
        "en": "This loan must be repaid across {value} installments.",
        "hi": "यह ऋण कुल {value} किश्तों में चुकाया जाना है।",
    },
    "processing_fee": {
        "te": "ప్రాసెసింగ్ రుసుముగా {value} రూపాయలు ముందుగానే మినహాయిస్తారు.",
        "en": "A processing fee of {value} rupees is deducted upfront.",
        "hi": "प्रोसेसिंग शुल्क के रूप में {value} रुपये पहले ही काट लिए जाते हैं।",
    },
    "insurance_premium": {
        "te": "బీమా ప్రీమియం కొరకు {value} రూపాయలు చెల్లించాల్సి ఉంటుంది.",
        "en": "An insurance premium of {value} rupees is charged for protection.",
        "hi": "बीमा प्रीमियम के लिए {value} रुपये का शुल्क लिया जाता है।",
    },
    "total_payable": {
        "te": "అప్పు మరియు వడ్డీ కలిపి మొత్తం మీద {value} రూపాయలు చెల్లించాలి.",
        "en": "In total across all repayments, you will pay back {value} rupees.",
        "hi": "मूलधन और ब्याज मिलाकर कुल मिलाकर {value} रुपये चुकाने होंगे।",
    },
    "penalty": {
        "te": "వాయిదా ఆలస్యమైతే అపరాధ రుసుము {value} రూపాయలు పడుతుంది.",
        "en": "If an installment is delayed, a penalty fee of {value} rupees applies.",
        "hi": "किस्त में देरी होने पर {value} रुपये का जुर्माना लागू होगा।",
    },
    "tenure": {
        "te": "ఈ లోన్ కాలపరిమితి {value} నెలలు.",
        "en": "The total tenure of this loan is {value} months.",
        "hi": "इस ऋण की कुल अवधि {value} महीने है।",
    },
}


def generate_explanation(
    client: GemmaClient, terms: LoanTerms, skill: Skill, only_field_ids: list[str] | None = None
) -> tuple[list[ExplanationSentence], list[tuple[ExplanationSentence, str]], dict[str, float]]:
    """Returns (kept, dropped, latency_by_field_id). Pass only_field_ids to regenerate
    just a subset (targeted re-explanation after a wrong quiz answer)."""
    drafts: list[ExplanationSentence] = []
    latency_by_field: dict[str, float] = {}
    field_order = only_field_ids if only_field_ids is not None else EXPLAIN_FIELD_ORDER
    for field_id in field_order:
        field = terms.get(field_id)
        if field is None or field.value is None:
            continue
        prompt = _PROMPT_TEMPLATE.format(
            field_id=field_id,
            value=field.value,
            source_text=field.source_text,
            glossary_entry=skill.glossary.get(field_id, ""),
        )
        result = client.generate(prompt)
        text_te = result["text"].strip()
        val_str = str(field.value)
        tmpl = EXPLAIN_TEMPLATES.get(field_id, {})
        text_en = tmpl.get("en", f"The value for {field_id.replace('_', ' ')} is {val_str}.").format(value=val_str)
        text_hi = tmpl.get("hi", f"{field_id.replace('_', ' ')} का मूल्य {val_str} है।").format(value=val_str)

        drafts.append(ExplanationSentence(
            field_id=field_id,
            text_te=text_te,
            text_en=text_en,
            text_hi=text_hi,
        ))
        latency_by_field[field_id] = float(result.get("latency_s", 0.0))

    kept, dropped = filter_explanation(drafts, terms)
    return kept, dropped, latency_by_field
