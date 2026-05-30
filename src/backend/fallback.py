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
        body = (
            f"{body}（エネルギー変換の観点では、入力の運動エネルギーを"
            "回転運動として取り出し、発電機へ伝達します。）"
        )

    audience_prefix = {
        "自分": "自分が理解するには：",
        "相手": "相手に説明するときは：",
        "みんな": "みんなに伝えるなら：",
    }
    body = f"{audience_prefix.get(aud, '')}{body}"

    scene_suffix = {
        "会議": " 要点を3つに絞って話すと伝わりやすいです。",
        "学校": " 身近な例え（扇風機や水車）を添えると理解が深まります。",
        "日常": " 身の回りの「回って何かを作る」ものに例えるとイメージしやすいです。",
        "審査": " デモでは「入力→回転→出力」を短く見せるのが効果的です。",
    }
    body = f"{body}{scene_suffix.get(scene, '')}"
    return body[:280]


def base_answers_for_question(q: str) -> list[dict[str, str]]:
    t = q.lower()

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
            {
                "headline": "身近な例",
                "body": "風力発電の大きな扇風機のような形を想像すると分かりやすいです。",
            },
        ]

    if "風力" in t or ("風" in t and "発電" in t):
        return [
            {
                "headline": "風力タービンの答え",
                "body": "風で羽根が回り、発電機とつながって電気を作ります。",
            },
        ]

    if "蒸気" in t:
        return [
            {
                "headline": "蒸気タービンの答え",
                "body": "ボイラーで作った蒸気が羽根を回し、発電機を動かして電気を作ります。",
            },
        ]

    if "水力" in t or ("水" in t and "発電" in t):
        return [
            {
                "headline": "水力タービンの答え",
                "body": "ダムなどの水の流れで羽根が回り、発電機で電気を作ります。",
            },
        ]

    return [
        {
            "headline": "ご質問への答え",
            "body": (
                f"「{q}」について、タービン（回転してエネルギーを変える仕組み）の"
                "視点では、力や流れを別の形に変換することが大切、と考えられます。"
            ),
        },
        {
            "headline": "もう少し詳しく",
            "body": "タービンは「入力→回転→出力（電気など）」という変換の連鎖で動く装置です。",
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
                    "body": "例：「タービンって何？」と書いて「仕掛けを動かす」を押してください。",
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
