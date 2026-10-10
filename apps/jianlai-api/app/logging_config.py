"""日志：对照 onion-agent。Railway 上看请求一行，别被心跳刷掉。

环境变量：
  LOG_LEVEL   默认 INFO
  LOG_FORMAT  text | json，默认 text
"""

from __future__ import annotations

import logging
import os
import sys

SLOW_REQUEST_THRESHOLD_MS = 3000

_TEXT_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_TEXT_DATEFMT = "%H:%M:%S"


class QuietAiBotLogger:
    """挡住 AiBotSDK 心跳；告警和错误接到 jianlai 日志。"""

    def debug(self, message: str, *args: object) -> None:
        return

    def info(self, message: str, *args: object) -> None:
        return

    def warn(self, message: str, *args: object) -> None:
        get_logger("jianlai.wecom").warning("%s", message)

    def error(self, message: str, *args: object) -> None:
        get_logger("jianlai.wecom").error("%s", message)


def setup_logging() -> None:
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    log_format = os.environ.get("LOG_FORMAT", "text").lower()

    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if log_format == "json":
        handler.setFormatter(
            logging.Formatter(
                '{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
            )
        )
    else:
        handler.setFormatter(logging.Formatter(_TEXT_FORMAT, datefmt=_TEXT_DATEFMT))
    root.addHandler(handler)

    for noisy in (
        "httpx",
        "httpcore",
        "uvicorn.access",
        "uvicorn.error",
        "watchfiles.main",
        "AiBotSDK",
        "websockets",
        "websocket",
    ):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
