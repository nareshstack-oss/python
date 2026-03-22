from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

base_dir = Path(__file__).resolve().parent
load_dotenv(base_dir / ".env")

credentials_path = Path(os.getenv("GMAIL_CREDENTIALS_FILE", base_dir / "secrets" / "credentials.json")).resolve()
token_path = Path(os.getenv("GMAIL_TOKEN_FILE", base_dir / "secrets" / "token.json")).resolve()
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

mcp = FastMCP("gmail-cleaner")
pending_plans: dict[str, dict[str, Any]] = {}


def get_gmail_service():
    if not token_path.exists():
        raise RuntimeError(
            "Gmail token not found. Run `python authorize_gmail.py` in email_mcp/ first."
        )

    creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_path.write_text(creds.to_json(), encoding="utf-8")

    if not creds.valid:
        raise RuntimeError("Saved Gmail token is invalid. Re-run `python authorize_gmail.py`.")

    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def normalize_date(header_value: str | None) -> str | None:
    if not header_value:
        return None
    try:
        return parsedate_to_datetime(header_value).astimezone(timezone.utc).isoformat()
    except Exception:
        return header_value


def fetch_messages(query: str, limit: int) -> list[dict[str, Any]]:
    service = get_gmail_service()
    response = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=min(limit, 100),
        includeSpamTrash=False,
    ).execute()

    messages = response.get("messages", [])
    if not messages:
        return []

    results: list[dict[str, Any]] = []
    for message in messages:
        detail = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()
        headers = {
            header["name"]: header["value"]
            for header in detail.get("payload", {}).get("headers", [])
        }
        results.append(
            {
                "id": detail["id"],
                "threadId": detail.get("threadId"),
                "from": headers.get("From", ""),
                "subject": headers.get("Subject", "(no subject)"),
                "date": normalize_date(headers.get("Date")),
                "snippet": detail.get("snippet", ""),
            }
        )
    return results


def filter_by_age(messages: list[dict[str, Any]], older_than_days: int | None) -> list[dict[str, Any]]:
    if not older_than_days:
        return messages

    cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
    filtered: list[dict[str, Any]] = []
    for message in messages:
        try:
            if message["date"] and datetime.fromisoformat(message["date"]) < cutoff:
                filtered.append(message)
        except Exception:
            continue
    return filtered


def classify_with_deepseek(messages: list[dict[str, Any]]) -> list[str]:
    if not deepseek_api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured.")

    prompt = {
        "role": "user",
        "content": (
            "You are classifying unread emails for safe cleanup. "
            "Return only JSON with key `trash_ids` containing message IDs that are likely safe to trash "
            "(promotions, newsletters, automated notices, marketing). "
            "Do not include personal, work, finance, security, OTP, receipts, or travel-related emails.\n\n"
            f"Emails:\n{json.dumps(messages, ensure_ascii=True)}"
        ),
    }

    response = httpx.post(
        f"{deepseek_base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {deepseek_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": deepseek_model,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": "Respond with strict JSON only.",
                },
                prompt,
            ],
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    return parsed.get("trash_ids", [])


@mcp.tool()
def gmail_auth_status() -> dict[str, Any]:
    return {
        "credentials_file_exists": credentials_path.exists(),
        "token_file_exists": token_path.exists(),
        "deepseek_configured": bool(deepseek_api_key),
        "next_step": (
            "Run `python authorize_gmail.py` in email_mcp/ if token_file_exists is false."
        ),
    }


@mcp.tool()
def list_unread_emails(query: str = "is:unread in:inbox", limit: int = 20) -> dict[str, Any]:
    messages = fetch_messages(query=query, limit=limit)
    return {
        "query": query,
        "count": len(messages),
        "emails": messages,
    }


@mcp.tool()
def draft_trash_plan(
    query: str = "is:unread in:inbox",
    limit: int = 50,
    older_than_days: int | None = None,
    use_deepseek_filter: bool = False,
) -> dict[str, Any]:
    messages = fetch_messages(query=query, limit=limit)
    messages = filter_by_age(messages, older_than_days)

    selected_messages = messages
    if use_deepseek_filter and messages:
        selected_ids = set(classify_with_deepseek(messages))
        selected_messages = [message for message in messages if message["id"] in selected_ids]

    plan_id = str(uuid.uuid4())
    pending_plans[plan_id] = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "older_than_days": older_than_days,
        "use_deepseek_filter": use_deepseek_filter,
        "emails": selected_messages,
    }

    return {
        "plan_id": plan_id,
        "query": query,
        "older_than_days": older_than_days,
        "use_deepseek_filter": use_deepseek_filter,
        "candidate_count": len(selected_messages),
        "preview": selected_messages[:10],
        "confirmation_required": True,
        "action": "trash",
    }


@mcp.tool()
def execute_trash_plan(plan_id: str, confirm: bool = False) -> dict[str, Any]:
    if not confirm:
        return {
            "plan_id": plan_id,
            "executed": False,
            "message": "Confirmation required. Re-run with confirm=true.",
        }

    plan = pending_plans.get(plan_id)
    if not plan:
        raise RuntimeError("Plan not found or already executed.")

    service = get_gmail_service()
    trashed_ids: list[str] = []
    for message in plan["emails"]:
        service.users().messages().trash(userId="me", id=message["id"]).execute()
        trashed_ids.append(message["id"])

    del pending_plans[plan_id]
    return {
        "plan_id": plan_id,
        "executed": True,
        "trashed_count": len(trashed_ids),
        "trashed_ids": trashed_ids,
        "action": "trash",
    }


@mcp.tool()
def discard_trash_plan(plan_id: str) -> dict[str, Any]:
    removed = pending_plans.pop(plan_id, None)
    return {
        "plan_id": plan_id,
        "discarded": removed is not None,
    }


if __name__ == "__main__":
    mcp.run()
