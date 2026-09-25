"""仙童穗儿：往企业微信群机器人 webhook 发入群欢迎语。

用法：
    uv run python -m app.xiantong 木木 破阵门 开锋境 男
    uv run python -m app.xiantong 木木 破阵门 开锋境 男 --dry-run
"""

import argparse
import json
import sys
import urllib.request

from app.config import settings

SECT_LINES = {
    "问剑门": "此后登门问剑，现场由你去接。",
    "破阵门": "此后破阵开路，系统由你打通。",
    "映剑门": "此后以剑映光，界面由你点亮。",
}
SEEDLING_LINE = "剑胚初成，且随师兄师姐磨上一磨。"
SEEDLING = "剑胚"


def compose(name: str, sect: str, realm: str, gender: str) -> str:
    if sect not in SECT_LINES:
        raise ValueError(f"门派只能是 {'、'.join(SECT_LINES)}，收到：{sect}")
    if gender not in ("男", "女"):
        raise ValueError(f"性别只能是 男 / 女，收到：{gender}")

    sibling = "师兄" if gender == "男" else "师姐"
    sect_line = SEEDLING_LINE if realm == SEEDLING else SECT_LINES[sect]
    return "\n".join(
        [
            "🔔 叮——山门剑鸣，有客到！",
            "小童穗儿奉道长之命，前来通报诸位道友：",
            f"🗡️ {name}道友，今日入我剑来，",
            f"拜入【{sect}】，列【{realm}】。",
            sect_line,
            "🍃 往后同下山入世，斩尽天下不平事。",
            "诸位师兄师姐，快快出来相迎呀～",
            f"{name}{sibling}，穗儿给您奉茶啦 🍵",
        ]
    )


def send(text: str, webhook: str) -> dict:
    body = json.dumps({"msgtype": "text", "text": {"content": text}}).encode("utf-8")
    req = urllib.request.Request(
        webhook, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="仙童穗儿：发入群欢迎语")
    parser.add_argument("name", help="道友别名")
    parser.add_argument("sect", help="问剑门 / 破阵门 / 映剑门")
    parser.add_argument("realm", help="境界，例如 开锋境；未入境写 剑胚")
    parser.add_argument("gender", help="男 / 女")
    parser.add_argument("--dry-run", action="store_true", help="只打印，不发送")
    args = parser.parse_args()

    text = compose(args.name, args.sect, args.realm, args.gender)
    print(text)
    if args.dry_run:
        return 0

    if not settings.wecom_group_webhook:
        print("\n缺 WECOM_GROUP_WEBHOOK，先在 .env 里填群机器人地址", file=sys.stderr)
        return 1

    result = send(text, settings.wecom_group_webhook)
    if result.get("errcode") != 0:
        print(f"\n发送失败：{result}", file=sys.stderr)
        return 1
    print("\n已发送")
    return 0


if __name__ == "__main__":
    sys.exit(main())
