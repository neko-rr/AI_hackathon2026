"""Lambda / ローカル API ハンドラ"""

from __future__ import annotations

import json
import traceback

from fallback import build_fallback_response
from io_intelligence import generate_delivery_items, get_api_key
from prompts import SYSTEM_PROMPT, build_user_prompt
from schemas import (
    DELIVERY_TITLE,
    MAX_TEXT_LEN,
    apply_question_scene,
    clean_delivery_items,
    format_turbine_recap,
    parse_request_body,
)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
}


def _json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False),
    }


def deliver(question: str, fluid_type: str, turbines: dict[str, str]) -> dict:
    effective_turbines = apply_question_scene(question, turbines)
    recap = format_turbine_recap(effective_turbines)

    if not question:
        return build_fallback_response(question, fluid_type, effective_turbines)

    if not get_api_key():
        return build_fallback_response(question, fluid_type, effective_turbines)

    try:
        user_prompt = build_user_prompt(question, fluid_type, effective_turbines)
        raw_items = generate_delivery_items(SYSTEM_PROMPT, user_prompt)
        items = clean_delivery_items(raw_items)
        if not items:
            raise ValueError("empty deliveryItems after clean")

        return {
            "question": question,
            "fluidType": fluid_type,
            "turbines": effective_turbines,
            "turbineRecap": recap,
            "deliveryTitle": DELIVERY_TITLE,
            "deliveryItems": items,
            "fallback": False,
        }
    except Exception as e:
        print(f"deliver AI fallback: {e}")
        traceback.print_exc()
        return build_fallback_response(question, fluid_type, effective_turbines)


def handle_http(method: str, body_raw: str | bytes | None) -> tuple[int, dict]:
    if method == "OPTIONS":
        return 204, {}

    if method != "POST":
        return 405, {"error": "method_not_allowed"}

    try:
        if isinstance(body_raw, bytes):
            body_raw = body_raw.decode("utf-8")
        payload = json.loads(body_raw or "{}")
    except json.JSONDecodeError:
        return 400, {"error": "invalid_json"}

    raw_text = payload.get("text")
    if raw_text is not None and len(str(raw_text).strip()) > MAX_TEXT_LEN:
        return 400, {
            "error": "text_too_long",
            "message": f"質問は{MAX_TEXT_LEN}文字以内にしてください",
        }

    question, fluid_type, turbines = parse_request_body(payload)
    result = deliver(question, fluid_type, turbines)
    return 200, result


def lambda_handler(event, context):
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "POST"
    )
    body = event.get("body", "")

    status, payload = handle_http(method, body)

    if status == 204:
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    return _json_response(status, payload)
