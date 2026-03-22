from __future__ import annotations

from pathlib import Path
import re

from .models import ResumeInput, ResumeOutput


class ResumeStorage:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.latest_input_file = self.data_dir / "latest_input.json"
        self.latest_resume_file = self.data_dir / "latest_resume.json"

    def save_input(self, payload: ResumeInput) -> None:
        self.latest_input_file.write_text(payload.model_dump_json(indent=2), encoding="utf-8")

    def load_latest_input(self) -> ResumeInput | None:
        if not self.latest_input_file.exists():
            return None
        return ResumeInput.model_validate_json(self.latest_input_file.read_text(encoding="utf-8"))

    def save_resume(self, payload: ResumeOutput) -> None:
        self.latest_resume_file.write_text(payload.model_dump_json(indent=2), encoding="utf-8")

    def load_latest_resume(self) -> ResumeOutput | None:
        if not self.latest_resume_file.exists():
            return None
        return ResumeOutput.model_validate_json(self.latest_resume_file.read_text(encoding="utf-8"))

    def safe_filename_prefix(self, headline: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", headline.strip().lower()).strip("-")
        return cleaned or "resume"
