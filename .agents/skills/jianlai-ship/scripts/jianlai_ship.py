#!/usr/bin/env python3
"""jianlai-ship 机械核对：列出改动面、构建、验证线上。审查和 git 提交仍由 Agent 做。"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
API = "https://jianlai-api-production.up.railway.app"
CAFE = "https://jianlai.brewshujian.cafe"
API_HOST = "jianlai-api-production.up.railway.app"

NEVER_COMMIT = (
    ".env",
    ".env.local",
    "staff_hr.local.csv",
    "staff_accounts.local.csv",
)
NEVER_COMMIT_SUFFIX = (".local.csv", ".local.md")
NEVER_COMMIT_PARTS = ("/dist/", "/dist-pages/", "/.venv/", "/node_modules/")

CLASSIFIERS = (
    ("api", ("apps/jianlai-api/", "schemas/")),
    ("web", ("apps/jianlai-web/",)),
    ("console", ("apps/jianlai-console/",)),
    ("ship", (".agents/skills/jianlai-ship/", ".agents/", "justfile", "AGENTS.md")),
    ("docs", ("knowledge/",)),
)


def run(argv: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        argv,
        cwd=cwd or ROOT,
        text=True,
        capture_output=True,
        check=check,
    )


def git_paths() -> list[str]:
    out = run(["git", "-c", "core.quotepath=false", "status", "--porcelain", "-u"]).stdout.splitlines()
    paths: list[str] = []
    for line in out:
        if not line.strip():
            continue
        raw = line[3:]
        if " -> " in raw:
            raw = raw.split(" -> ", 1)[1]
        paths.append(raw.strip().strip('"'))
    return paths


def classify(paths: list[str]) -> dict[str, list[str]]:
    buckets: dict[str, list[str]] = {name: [] for name, _ in CLASSIFIERS}
    buckets["other"] = []
    for path in paths:
        hit = False
        for name, prefixes in CLASSIFIERS:
            if any(path == p.rstrip("/") or path.startswith(p) for p in prefixes):
                buckets[name].append(path)
                hit = True
                break
        if not hit:
            buckets["other"].append(path)
    return buckets


def is_forbidden(path: str) -> bool:
    name = Path(path).name
    if name in NEVER_COMMIT:
        return True
    if name.endswith(NEVER_COMMIT_SUFFIX):
        return True
    normalized = "/" + path.replace("\\", "/").lstrip("/")
    return any(part in normalized for part in NEVER_COMMIT_PARTS)


def cmd_plan(_args: argparse.Namespace) -> int:
    paths = git_paths()
    if not paths:
        print("工作区干净。若已提交未推送，看 git log origin/main..HEAD")
        return 0
    buckets = classify(paths)
    forbidden = [p for p in paths if is_forbidden(p)]
    print(f"仓：{ROOT}")
    print(f"改动 {len(paths)} 个文件")
    for name, items in buckets.items():
        if not items:
            continue
        print(f"\n[{name}] {len(items)}")
        for item in items:
            mark = "  禁止提交  " if is_forbidden(item) else "  "
            print(f"{mark}{item}")
    sqls = [p for p in paths if p.endswith(".sql")]
    if sqls:
        print("\nDDL 提醒：先在生产库执行，再发依赖这些表的代码：")
        for item in sqls:
            print(f"  {item}")
    if forbidden:
        print("\n这些文件不能进 git。确认没有被 staged。")
        return 1
    need = []
    if buckets["api"]:
        need.append("发 API（git push main 或根目录 just deploy-api）")
    if buckets["web"] or buckets["console"]:
        need.append("发 Pages（just deploy-pages）")
    if need:
        print("\n建议发布：")
        for line in need:
            print(f"  - {line}")
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    paths = git_paths()
    buckets = classify(paths)
    full = args.full
    steps: list[tuple[str, list[str], Path]] = []
    if full or buckets["api"]:
        steps.append(("ruff", ["uv", "run", "ruff", "check", "app"], ROOT / "apps/jianlai-api"))
    if full or buckets["web"]:
        steps.append(("web build", ["bun", "run", "build"], ROOT / "apps/jianlai-web"))
    if full or buckets["console"]:
        steps.append(("console build", ["bun", "run", "build"], ROOT / "apps/jianlai-console"))
    if not steps:
        print("没有 API / 官网 / 内务改动，跳过构建")
        return 0
    failed = 0
    for title, argv, cwd in steps:
        print(f"→ {title}  ({cwd})")
        proc = run(argv, cwd=cwd, check=False)
        if proc.stdout:
            sys.stdout.write(proc.stdout)
        if proc.stderr:
            sys.stderr.write(proc.stderr)
        if proc.returncode != 0:
            print(f"失败：{title} exit {proc.returncode}")
            failed = proc.returncode
    return failed


def http_json(url: str, method: str = "GET", headers: dict[str, str] | None = None, body: bytes | None = None) -> tuple[int, str, dict[str, str]]:
    hdr = {"User-Agent": "jianlai-ship"}
    if headers:
        hdr.update(headers)
    req = urllib.request.Request(url, data=body, method=method, headers=hdr)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", "replace")
            hdrs = {k.lower(): v for k, v in resp.headers.items()}
            return resp.status, raw, hdrs
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        hdrs = {k.lower(): v for k, v in exc.headers.items()}
        return exc.code, raw, hdrs


def entry_js(html: str, kind: str) -> str | None:
    patterns = {
        "web": r'src="(/assets/index-[^"]+\.js)"',
        "dashboard": r'src="(/dashboard/assets/index-[^"]+\.js)"',
    }
    match = re.search(patterns[kind], html)
    return match.group(1) if match else None


def cmd_verify(args: argparse.Namespace) -> int:
    ok = True
    if not args.skip_api:
        status, raw, _ = http_json(f"{API}/health")
        print(f"API /health {status} {raw.strip()}")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {}
        if status != 200 or payload.get("service") != "jianlai-api":
            print("API 健康检查未通过")
            ok = False
        origin = "https://jianlai.brewshujian.cafe"
        status, _, hdrs = http_json(
            f"{API}/api/auth/login",
            method="OPTIONS",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        allow = hdrs.get("access-control-allow-origin", "")
        print(f"CORS OPTIONS login {status} allow-origin={allow}")
        if status != 200 or allow not in (origin, "*"):
            print("CORS 未放行官网后台")
            ok = False
    if not args.skip_pages:
        status, html, _ = http_json(f"{CAFE}/dashboard/")
        print(f"cafe /dashboard/ {status}")
        if status != 200:
            print("自定义域后台没起来")
            ok = False
        else:
            asset = entry_js(html, "dashboard")
            print(f"dashboard 入口 JS {asset or '未找到'}")
            if asset:
                js_status, js, _ = http_json(f"{CAFE}{asset}")
                has_api = API_HOST in js
                print(f"dashboard bundle {js_status} 含线上 API={has_api}")
                if js_status != 200 or not has_api:
                    print("内务包没有打进 Railway API 地址，登录会打到 Pages 上变成 405")
                    ok = False
        status, html, _ = http_json(f"{CAFE}/")
        print(f"cafe / {status} 入口 {entry_js(html, 'web') or '未找到'}")
        if status != 200:
            ok = False
    print("通过" if ok else "未通过")
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="剑来发版核对")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("plan", help="列出改动面和禁止提交的文件")
    check = sub.add_parser("check", help="按改动面构建")
    check.add_argument("--full", action="store_true")
    verify = sub.add_parser("verify", help="探线上 API / CORS / Pages")
    verify.add_argument("--skip-api", action="store_true")
    verify.add_argument("--skip-pages", action="store_true")
    args = parser.parse_args()
    if args.cmd == "plan":
        return cmd_plan(args)
    if args.cmd == "check":
        return cmd_check(args)
    if args.cmd == "verify":
        return cmd_verify(args)
    return 2


if __name__ == "__main__":
    sys.exit(main())
