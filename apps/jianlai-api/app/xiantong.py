"""仙童穗儿：入门报信，以及用 Sophnet DeepSeek-Flash 回群聊。

用法：
    uv run python -m app.xiantong serve
    uv run python -m app.xiantong 木木 破阵门 开锋境 男
    uv run python -m app.xiantong 木木 破阵门 开锋境 男 --dry-run
"""

import argparse
import asyncio
import json
import re
import sys
import urllib.request
from collections import defaultdict

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


SYSTEM = """你是剑来科技山门的仙童穗儿，系在剑柄上的一缕红穗。
说话像山门里的小孩：短、清楚、带一点仙气，不端着，不叫人宝宝。
剑是驻场的人。进企业现场是修行入世。斩的是流程上的不平：重复劳动、对不上的账、说不清谁负责的交接。
三门：问剑门管销售，破阵门管开发，映剑门管设计。境界从识剑到剑仙，中三境第一层是开锋境。道长是书剑。
别人问剑来，就按上面说。不知道的事实不要编，尤其不要编客户名、人数、报价和业绩。报价口径只有一句：同样的活比传统软件公司低 30%–50%。
回应用中文，尽量控制在两三句。"""

_HISTORY: dict[str, list[dict[str, str]]] = defaultdict(list)
_MENTION = re.compile(r"@穗儿\s*")


def strip_mention(content: str) -> str:
    return _MENTION.sub("", content or "").strip()


def ask(history: list[dict[str, str]], question: str) -> str:
    if not settings.sophnet_api_key:
        raise RuntimeError("缺 SOPHNET_API_KEY")
    url = settings.sophnet_base_url.rstrip("/") + "/chat/completions"
    messages = [{"role": "system", "content": SYSTEM}, *history, {"role": "user", "content": question}]
    payload = {
        "model": settings.sophnet_model or "DeepSeek-Flash",
        "messages": messages,
        "enable_thinking": False,
        "chat_template_kwargs": {"enable_thinking": False},
        "reasoning": {"enabled": False},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.sophnet_api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    text = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    return text.strip() or "穗儿这次没想出话来，道友再说一遍。"


def remember(chatid: str, question: str, answer: str) -> None:
    turns = _HISTORY[chatid]
    turns.append({"role": "user", "content": question})
    turns.append({"role": "assistant", "content": answer})
    del turns[:-8]


async def serve() -> None:
    from aibot import WSClient, WSClientOptions
    from aibot.utils import generate_random_string

    from app.logging_config import QuietAiBotLogger

    if not settings.wecom_bot_id or not settings.wecom_bot_secret:
        raise RuntimeError("缺 WECOM_BOT_ID 或 WECOM_BOT_SECRET")

    client = WSClient(
        WSClientOptions(
            bot_id=settings.wecom_bot_id,
            secret=settings.wecom_bot_secret,
            max_reconnect_attempts=-1,
            logger=QuietAiBotLogger(),
        )
    )

    async def on_text(frame: dict) -> None:
        body = frame.get("body") or {}
        question = strip_mention((body.get("text") or {}).get("content") or "")
        chatid = body.get("chatid") or "single"
        if not question:
            answer = "道友唤我何事？说给我听。"
        else:
            try:
                answer = await asyncio.to_thread(ask, list(_HISTORY[chatid]), question)
                remember(chatid, question, answer)
            except (OSError, RuntimeError, ValueError, KeyError) as exc:
                print(f"模型失败：{exc}", file=sys.stderr)
                answer = "穗儿这会儿接不上剑上的锋，稍后再问我。"
        await client.reply_stream(frame, generate_random_string(16), answer, finish=True)

    client.on("message.text", lambda frame: asyncio.create_task(on_text(frame)))
    print("穗儿在听。群里 @穗儿 说话。")
    await client.connect()
    await asyncio.Event().wait()


def send(text: str, webhook: str) -> dict:
    body = json.dumps({"msgtype": "text", "text": {"content": text}}).encode("utf-8")
    req = urllib.request.Request(
        webhook, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    if len(sys.argv) == 1 or sys.argv[1] == "serve":
        try:
            asyncio.run(serve())
        except KeyboardInterrupt:
            return 0
        return 0

    parser = argparse.ArgumentParser(description="仙童穗儿：入门报信，或挂着听群聊")
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
