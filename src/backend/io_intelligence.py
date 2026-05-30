"""IO Intelligence API クライアント（urllib のみ）"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

IO_BASE_URL = "https://api.intelligence.io.solutions/api/v1/chat/completions"
DEFAULT_LLM_MODEL = "meta-llama/Llama-3.3-70B-Instruct"
DEFAULT_FALLBACK_MODEL = "mistralai/Mistral-Large-Instruct-2411"
REQUEST_TIMEOUT_SEC = 22


def get_api_key() -> str:
    return (os.environ.get("IO_INTELLIGENCE_API_KEY") or "").strip()


def get_primary_model() -> str:
    return (
        os.environ.get("IO_INTELLIGENCE_LLM_MODEL") or DEFAULT_LLM_MODEL
    ).strip()


def get_fallback_model() -> str:
    return (
        os.environ.get("IO_INTELLIGENCE_FALLBACK_MODEL") or DEFAULT_FALLBACK_MODEL
    ).strip()


def _extract_json(text: str) -> dict | None:
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def chat_completion(
    system_prompt: str,
    user_prompt: str,
    model: str,
) -> dict:
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("IO_INTELLIGENCE_API_KEY is not set")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.5,
        "max_completion_tokens": 1200,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        IO_BASE_URL,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "hackathon-deliver/1.0 (IO-Intelligence-Client)",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"IO API HTTP {e.code}: {err_body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"IO API network error: {e.reason}") from e

    parsed = json.loads(raw)
    choices = parsed.get("choices") or []
    if not choices:
        raise RuntimeError("IO API returned no choices")

    content = choices[0].get("message", {}).get("content", "")
    result = _extract_json(content)
    if not result:
        raise RuntimeError("IO API response is not valid JSON")
    return result


def generate_delivery_items(system_prompt: str, user_prompt: str) -> list[dict[str, str]]:
    models = [get_primary_model(), get_fallback_model()]
    seen: set[str] = set()
    last_error: Exception | None = None

    for model in models:
        if model in seen:
            continue
        seen.add(model)
        try:
            data = chat_completion(system_prompt, user_prompt, model)
            items = data.get("deliveryItems")
            if isinstance(items, list) and items:
                return items
            raise RuntimeError("deliveryItems missing or empty")
        except Exception as e:
            last_error = e
            print(f"io_intelligence model={model} failed: {e}")

    if last_error:
        raise last_error
    raise RuntimeError("No models configured")
