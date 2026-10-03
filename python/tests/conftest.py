from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = json.loads((ROOT / "fixtures" / "validators.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def fixtures() -> dict:
    return FIXTURES
