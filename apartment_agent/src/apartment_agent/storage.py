from __future__ import annotations

import json
from pathlib import Path

from .models import DailyDigest, SearchPreferences


class Storage:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.preferences_file = self.data_dir / "preferences.json"
        self.digest_file = self.data_dir / "latest_digest.json"

    def save_preferences(self, preferences: SearchPreferences) -> None:
        self.preferences_file.write_text(preferences.model_dump_json(indent=2), encoding="utf-8")

    def load_preferences(self) -> SearchPreferences | None:
        if not self.preferences_file.exists():
            return None
        return SearchPreferences.model_validate_json(self.preferences_file.read_text(encoding="utf-8"))

    def save_digest(self, digest: DailyDigest) -> None:
        self.digest_file.write_text(digest.model_dump_json(indent=2), encoding="utf-8")

    def load_digest(self) -> DailyDigest | None:
        if not self.digest_file.exists():
            return None
        return DailyDigest.model_validate_json(self.digest_file.read_text(encoding="utf-8"))
