"""入出力バリデーション"""

from __future__ import annotations

MAX_TEXT_LEN = 500
MAX_BODY_LEN = 300
MAX_HEADLINE_LEN = 40
MAX_DELIVERY_ITEMS = 3
DELIVERY_TITLE = "届いたアイデア"

TURBINE_KEYS = ("difficulty", "audience", "scene")
FLUID_TYPES = ("liquid", "steam")
SCENE_ORDER = ("会議", "学校", "審査", "日常")
SCENE_KEYWORDS = {
    "会議": ("会議", "打合せ", "打ち合わせ", "ミーティング", "商談"),
    "学校": ("学校", "授業", "教室", "学生", "先生"),
    "審査": ("審査", "評価", "ジャッジ", "judge", "審査員"),
    "日常": ("日常", "普段", "ふだん", "生活", "毎日"),
}


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


def extract_scene_from_question(question: str | None) -> str:
    q = sanitize_text(question)
    if not q:
        return ""
    best_scene = ""
    best_idx = 10**9
    for scene in SCENE_ORDER:
        for keyword in SCENE_KEYWORDS[scene]:
            idx = q.find(keyword)
            if idx >= 0 and idx < best_idx:
                best_idx = idx
                best_scene = scene
    return best_scene


def apply_question_scene(question: str, turbines: dict[str, str]) -> dict[str, str]:
    """質問文に場面があれば優先し、なければ既存タービン値を使う。"""
    scene = extract_scene_from_question(question)
    if not scene:
        return turbines
    merged = dict(turbines or {})
    merged["scene"] = scene
    return merged


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
