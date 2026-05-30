"""デモ用ルールベース回答（IO API 未接続 / 障害時）"""

from __future__ import annotations

from schemas import DELIVERY_TITLE, format_turbine_recap

MIN_BODY_LEN = 100


def _normalize_ending(text: str) -> str:
    body = (text or "").strip()
    body = body.replace("ですか？", "です。").replace("ですか?", "です。")
    body = body.replace("でしょうか？", "です。").replace("でしょうか?", "です。")
    body = body.replace("ますか？", "ます。").replace("ますか?", "ます。")
    if body and not body.endswith(("。", "！", "!", ".")):
        body += "。"
    return body


def _remove_condition_words(text: str) -> str:
    body = text or ""
    body = body.replace("自分向けには：", "")
    body = body.replace("相手向けには：", "")
    body = body.replace("みんな向けには：", "")
    body = body.replace("自分が理解するには：", "")
    body = body.replace("相手に説明するときは：", "")
    body = body.replace("みんなに伝えるなら：", "")
    return " ".join(body.split())


def _proposal_expansion() -> str:
    return (
        "まず試す範囲を一つに絞って、最初の手順を具体的に実行してください。"
        "次に判断基準を一つ決めて候補を比較し、選んだ理由を短く記録してください。"
        "最後に結果を見て改善点を一つだけ追加し、次回の行動に反映してください。"
    )


def _split_sentences(text: str) -> list[str]:
    src = (text or "").strip()
    if not src:
        return []
    chunks: list[str] = []
    buf = ""
    for ch in src:
        buf += ch
        if ch in "。.!！?？":
            chunks.append(buf.strip())
            buf = ""
    if buf.strip():
        chunks.append(buf.strip())
    return chunks


def _force_proposal_after_first(text: str) -> str:
    chunks = _split_sentences(_remove_condition_words(_normalize_ending(text)))
    first = _normalize_ending(chunks[0] if chunks else text)
    return f"{first} {_proposal_expansion()}".strip()


def _ensure_min_length(text: str) -> str:
    body = _force_proposal_after_first(text)
    if not body:
        body = (
            "最初に目的を一文で決めてください。"
            "まず試す範囲を一つに絞って、最初の手順を具体的に実行してください。"
            "次に判断基準を一つ決めて候補を比較し、選んだ理由を短く記録してください。"
        )
    expansion = _proposal_expansion()
    while len(body) < MIN_BODY_LEN:
        body = f"{body} {expansion}".strip()
    return body[:300]


def adapt_body(base_body: str, turbines: dict[str, str]) -> str:
    diff = turbines.get("difficulty", "ふつう")

    body = base_body
    if diff == "やさしい":
        body = body.replace("装置", "仕組み").replace("エネルギー", "力")
    elif diff == "むずかしい":
        body = f"{body} 理由を一つ添えて選択肢を比較すると、判断の精度が上がります。"
    return _ensure_min_length(body)


def base_answers_for_question(q: str) -> list[dict[str, str]]:
    t = q.lower()

    if "猫" in t and ("好" in t or "かれる" in t):
        return [
            {
                "headline": "まずは安全に",
                "body": "無理に触らず、猫のペースに合わせるのが基本です。急接近や大声は避けましょう。",
            },
            {
                "headline": "距離の取り方",
                "body": "低い姿勢で、視線を合わせすぎず、おやつやおもちゃで関心を向けてみてください。",
            },
        ]

    if "ハッカソン" in t or "攻略" in t:
        return [
            {
                "headline": "時間の使い方",
                "body": "最初に動く最小版（MVP）を決め、見せる体験を最優先にすると成果が出やすいです。",
            },
            {
                "headline": "チーム運用",
                "body": "役割を分け、5分迷ったら削る。デモで見せる操作は3分以内に収まるように設計しましょう。",
            },
        ]

    if "ご飯" in t or "食事" in t or "昼" in t or "夕" in t:
        return [
            {
                "headline": "今日のごはん案",
                "body": "バランスを意識するなら、主食・たんぱく質・野菜の3つをそろえると選びやすいです。",
            },
            {
                "headline": "手軽な選択",
                "body": "時間がない日は丼ものやスープ付き定食など、一皿でそろうメニューもおすすめです。",
            },
        ]

    if "タービン" in t and ("何" in t or "?" in t or "？" in t):
        return [
            {
                "headline": "タービンとは",
                "body": "水や風、蒸気などの力で羽根が回り、その回転で電気を作る装置です。",
            },
            {
                "headline": "どう動く？",
                "body": "流れの力が羽根を回し、回転が発電機につながって電気になります。",
            },
        ]

    return [
        {
            "headline": "ご質問への答え",
            "body": "目的を一文で明確にし、最小の手順で一度試してから広げると、失敗を抑えながら成果を出しやすくなります。",
        },
        {
            "headline": "次の一歩",
            "body": "気になる点を一つ選び、今日中に試して結果を記録してください。次回は記録を見て改善点を一つだけ追加すると継続しやすくなります。",
        },
    ]


def build_fallback_response(
    question: str,
    fluid_type: str,
    turbines: dict[str, str],
) -> dict:
    recap = format_turbine_recap(turbines)

    if not question:
        return {
            "question": "",
            "fluidType": fluid_type,
            "turbines": turbines,
            "turbineRecap": recap,
            "deliveryTitle": DELIVERY_TITLE,
            "deliveryItems": [
                {
                    "headline": "質問を入力してください",
                    "body": "例：「猫に好かれる方法」と書いて「仕掛けを動かす」を押してください。",
                },
            ],
            "fallback": True,
        }

    items = [
        {
            "headline": item["headline"],
            "body": adapt_body(item["body"], turbines),
        }
        for item in base_answers_for_question(question)
    ]

    return {
        "question": question,
        "fluidType": fluid_type,
        "turbines": turbines,
        "turbineRecap": recap,
        "deliveryTitle": DELIVERY_TITLE,
        "deliveryItems": items,
        "fallback": True,
    }
