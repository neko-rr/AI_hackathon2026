"""入出力バリデーション"""

from __future__ import annotations

MAX_TEXT_LEN = 500
MAX_BODY_LEN = 300
MAX_HEADLINE_LEN = 40
MAX_DELIVERY_ITEMS = 3
DELIVERY_TITLE = "届いたアイデア"

TURBINE_KEYS = ("difficulty", "audience", "scene")
FLUID_TYPES = ("liquid", "steam")


def sanitize_text(text: str | None) -> str:
    if not text:
        return ""
    cleaned = "".join(c for c in str(text) if c >= " " or c in "\n\t")
    return cleaned.strip()[:MAX_TEXT_LEN]


def normalize_turbines(raw: dict | None) -> dict[str, str]:
    if not isinstance(raw, dict):
        return {}
    out: dict[str, str] = {}
    for key in TURBINE_KEYS:
        val = raw.get(key)
        if val is not None and str(val).strip():
            out[key] = str(val).strip()[:40]
    return out


def normalize_fluid_type(raw: str | None) -> str:
    if raw in FLUID_TYPES:
        return raw
    return "liquid"


def format_turbine_recap(turbines: dict[str, str]) -> str:
    labels = {
        "difficulty": "難易度",
        "audience": "対象",
        "scene": "場面",
    }
    parts = [f"{labels[k]}：{turbines[k]}" for k in TURBINE_KEYS if k in turbines]
    return " / ".join(parts)


def parse_request_body(body: dict | None) -> tuple[str, str, dict[str, str]]:
    if not isinstance(body, dict):
        return "", "liquid", {}
    text = sanitize_text(body.get("text"))
    fluid_type = normalize_fluid_type(body.get("fluidType"))
    turbines = normalize_turbines(body.get("turbines"))
    return text, fluid_type, turbines


def clean_delivery_items(items: list | None) -> list[dict[str, str]]:
    if not isinstance(items, list):
        return []
    cleaned: list[dict[str, str]] = []
    for item in items[:MAX_DELIVERY_ITEMS]:
        if not isinstance(item, dict):
            continue
        headline = str(item.get("headline") or "").strip()[:MAX_HEADLINE_LEN]
        body = str(item.get("body") or "").strip()[:MAX_BODY_LEN]
        if headline or body:
            cleaned.append({"headline": headline, "body": body})
    return cleaned
