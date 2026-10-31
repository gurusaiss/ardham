"""Loads an Agent Skill folder (SKILL.md frontmatter + questions.json + glossary.te.json)."""
from __future__ import annotations

import json
import re
from pathlib import Path

SKILLS_DIR = Path(__file__).parent.parent / "skills"


class Skill:
    def __init__(self, loan_type: str):
        skill_dir = SKILLS_DIR / loan_type
        if not skill_dir.is_dir():
            raise ValueError(f"Unknown loan type / skill: {loan_type!r}")

        skill_md = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
        frontmatter_match = re.match(r"^---\n(.*?)\n---\n(.*)$", skill_md, re.DOTALL)
        if not frontmatter_match:
            raise ValueError(f"SKILL.md for {loan_type} is missing YAML frontmatter")
        frontmatter_raw, body = frontmatter_match.groups()

        self.name = _frontmatter_field(frontmatter_raw, "name") or loan_type
        self.description = _frontmatter_field(frontmatter_raw, "description") or ""
        self.instructions = body.strip()

        self.questions: list[dict] = json.loads((skill_dir / "questions.json").read_text(encoding="utf-8"))
        self.glossary: dict[str, str] = json.loads(
            (skill_dir / "glossary.te.json").read_text(encoding="utf-8")
        )


def _frontmatter_field(raw: str, key: str) -> str | None:
    match = re.search(rf"^{key}:\s*(.+)$", raw, re.MULTILINE)
    return match.group(1).strip() if match else None


def list_loan_types() -> list[str]:
    return sorted(p.name for p in SKILLS_DIR.iterdir() if p.is_dir())
