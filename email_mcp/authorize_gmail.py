from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    load_dotenv(base_dir / ".env")

    credentials_path = Path(os.getenv("GMAIL_CREDENTIALS_FILE", base_dir / "secrets" / "credentials.json")).resolve()
    token_path = Path(os.getenv("GMAIL_TOKEN_FILE", base_dir / "secrets" / "token.json")).resolve()
    token_path.parent.mkdir(parents=True, exist_ok=True)

    creds: Credentials | None = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    elif not creds or not creds.valid:
        if not credentials_path.exists():
            raise FileNotFoundError(
                f"Gmail OAuth client file not found at {credentials_path}. "
                "Download it from Google Cloud Console and place it there first."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
        creds = flow.run_local_server(port=0)

    token_path.write_text(creds.to_json(), encoding="utf-8")
    print(f"Gmail token saved to {token_path}")


if __name__ == "__main__":
    main()
