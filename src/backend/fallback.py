"""デモ用ルールベース回答（IO API 未接続 / 障害時）"""

from __future__ import annotations

from schemas import DELIVERY_TITLE, format_turbine_recap


def adapt_body(base_body: str, turbines: dict[str, str]) -> str:
    diff = turbines.get("difficulty", "ふつう")
    aud = turbines.get("audience", "みんな")
    scene = turbines.get("scene", "日常")

    body = base_body
    if diff == "やさしい":
        body = body.replace("装置", "仕組み").replace("エネルギー", "力")
    elif diff == "むずかしい":
        body = f"{body}（もう一歩踏み込むと、背景や理由を押さえると理解が深まります。）"

    audience_prefix = {
        "自分": "自分が理解するには：",
        "相手": "相手に説明するときは：",
        "みんな": "みんなに伝えるなら：",
    }
    body = f"{audience_prefix.get(aud, '')}{body}"

    scene_suffix = {
        "会議": " 要点を3つに絞って話すと伝わりやすいです。",
        "学校": " 身近な例えを添えると理解が深まります。",
        "日常": " 身の回りの例に置き換えるとイメージしやすいです。",
        "審査": " 短くまとめて伝えると伝わりやすいです。",
    }
    body = f"{body}{scene_suffix.get(scene, '')}"
    return body[:300]


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
            "body": f"「{q}」について、まずは目的をはっきりさせ、小さく試してから広げていくのが近道です。",
        },
        {
            "headline": "次の一歩",
            "body": "気になる点を1つに絞り、今日できることから始めてみてください。",
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
