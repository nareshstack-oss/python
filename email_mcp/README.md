# Gmail Cleanup MCP Server

This is a local MCP server for unread email cleanup with safe defaults:

- Gmail only
- moves messages to Trash, not permanent delete
- requires a dry-run plan first
- requires explicit confirmation before execution
- can optionally use DeepSeek to narrow the trash plan to likely promotional emails

## Why this design

Blindly deleting all unread emails is a bad default. This server exposes:

- `list_unread_emails`
- `draft_trash_plan`
- `execute_trash_plan`
- `discard_trash_plan`

That gives you a preview and a confirmation boundary before anything is moved to Trash.

## Prerequisites

- Python 3.11+
- Gmail API enabled in Google Cloud
- OAuth desktop client credentials downloaded as `credentials.json`
- Optional: DeepSeek API key for AI filtering

Official references:

- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- Gmail quickstart: https://developers.google.com/workspace/gmail/api/quickstart/python
- Gmail list messages: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
- Gmail trash message: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/trash

## Setup

```bash
cd /Users/naresh/Desktop/PythonMaster/email_mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
mkdir -p secrets
```

Place your Google OAuth desktop client file at:

```text
email_mcp/secrets/credentials.json
```

If you want DeepSeek filtering, set `DEEPSEEK_API_KEY` in `.env`.

## Authorize Gmail

```bash
python authorize_gmail.py
```

This opens a browser-based OAuth flow and saves `token.json`.

## Run the MCP server

```bash
python server.py
```

## Example workflow

1. Check auth:

```text
gmail_auth_status
```

2. Preview unread messages:

```text
list_unread_emails
```

3. Draft a safe trash plan:

```text
draft_trash_plan(query="is:unread in:inbox", limit=50, older_than_days=30, use_deepseek_filter=true)
```

4. Execute only after reviewing the plan:

```text
execute_trash_plan(plan_id="...", confirm=true)
```

## Notes

- `execute_trash_plan` uses Gmail Trash, not permanent delete.
- DeepSeek is optional and only used to reduce risk by selecting likely promotional emails.
- This server does not permanently store email content outside the temporary in-memory plan.
