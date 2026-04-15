#!/usr/bin/env python3
"""Backend API for sales tab password protection + Notion alert."""
import json
import time
import subprocess
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── In-memory lockout store (keyed by visitor ID) ──
# { visitor_id: { "attempts": int, "locked_until": float_timestamp, "unlocked": bool } }
lockout_store = {}

CORRECT_PASSWORD = "Precious.Crystal"
MAX_ATTEMPTS = 3
LOCKOUT_SECONDS = 86400  # 24 hours

NOTION_PAGE_ID = "34302a99a1b780d398a1ed418ec4bb79"


def get_visitor(request: Request) -> str:
    return request.headers.get("X-Visitor-Id", "unknown")


def call_notion(source_id, tool_name, arguments):
    params = json.dumps({"source_id": source_id, "tool_name": tool_name, "arguments": arguments})
    result = subprocess.run(
        ["external-tool", "call", params],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        print(f"Notion API error: {result.stderr}")
        return None
    return json.loads(result.stdout)


class PasswordCheck(BaseModel):
    password: str


@app.get("/api/sales-auth/status")
def auth_status(request: Request):
    """Check if this visitor is locked out or already unlocked."""
    vid = get_visitor(request)
    info = lockout_store.get(vid, {"attempts": 0, "locked_until": 0, "unlocked": False})

    if info.get("unlocked"):
        return {"status": "unlocked"}

    now = time.time()
    if info["locked_until"] > now:
        remaining = int(info["locked_until"] - now)
        return {"status": "locked", "remaining_seconds": remaining}

    # If lockout expired, reset attempts
    if info["attempts"] >= MAX_ATTEMPTS and info["locked_until"] <= now:
        info["attempts"] = 0
        info["locked_until"] = 0
        lockout_store[vid] = info

    return {"status": "need_password", "attempts_left": MAX_ATTEMPTS - info["attempts"]}


@app.post("/api/sales-auth/verify")
def verify_password(body: PasswordCheck, request: Request):
    """Verify password. Track attempts. Lock after 3 failures."""
    vid = get_visitor(request)
    info = lockout_store.get(vid, {"attempts": 0, "locked_until": 0, "unlocked": False})
    now = time.time()

    # Already unlocked
    if info.get("unlocked"):
        return {"status": "unlocked"}

    # Currently locked
    if info["locked_until"] > now:
        remaining = int(info["locked_until"] - now)
        return {"status": "locked", "remaining_seconds": remaining}

    # Lockout expired → reset
    if info["attempts"] >= MAX_ATTEMPTS and info["locked_until"] <= now:
        info["attempts"] = 0
        info["locked_until"] = 0

    # Check password
    if body.password == CORRECT_PASSWORD:
        info["unlocked"] = True
        info["attempts"] = 0
        lockout_store[vid] = info
        return {"status": "unlocked"}

    # Wrong password
    info["attempts"] += 1
    attempts_left = MAX_ATTEMPTS - info["attempts"]

    if info["attempts"] >= MAX_ATTEMPTS:
        info["locked_until"] = now + LOCKOUT_SECONDS
        lockout_store[vid] = info

        # Send Notion alert
        try:
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%S+08:00")
            call_notion("notion_mcp", "notion-create-pages", {
                "parent": {"page_id": NOTION_PAGE_ID},
                "pages": [{
                    "properties": {"title": "銷售數據密碼錯誤"},
                    "icon": "🚨",
                    "content": (
                        f"**訪客 ID**：`{vid}`\n\n"
                        f"**時間**：{now_iso}\n\n"
                        f"連續輸入錯誤密碼 {MAX_ATTEMPTS} 次，已鎖定 24 小時。"
                    )
                }]
            })
        except Exception as e:
            print(f"Failed to create Notion page: {e}")

        return {"status": "locked", "remaining_seconds": LOCKOUT_SECONDS}

    lockout_store[vid] = info
    return {"status": "wrong_password", "attempts_left": attempts_left}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
