from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from .crew_runner import ApartmentCrewRunner
from .models import DailyDigest, SearchPreferences
from .search_service import SearchService
from .storage import Storage


class ApartmentScheduler:
    def __init__(self, storage: Storage) -> None:
        self.storage = storage
        self.search_service = SearchService()
        self.crew_runner = ApartmentCrewRunner()
        self.scheduler = BackgroundScheduler()

    def start(self) -> None:
        if not self.scheduler.running:
            self.scheduler.start()

    def shutdown(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    def config_status(self) -> dict:
        return {
            "has_preferences": self.storage.load_preferences() is not None,
            "has_digest": self.storage.load_digest() is not None,
            "scheduled_jobs": len(self.scheduler.get_jobs()),
        }

    def sync_with_saved_preferences(self) -> None:
        preferences = self.storage.load_preferences()
        if preferences:
            self.schedule_daily_job(preferences)

    def schedule_daily_job(self, preferences: SearchPreferences) -> None:
        hour, minute = preferences.daily_time.split(":")
        if self.scheduler.get_job("daily_apartment_refresh"):
            self.scheduler.remove_job("daily_apartment_refresh")
        self.scheduler.add_job(
            lambda: self.run_once(preferences),
            trigger=CronTrigger(hour=int(hour), minute=int(minute)),
            id="daily_apartment_refresh",
            replace_existing=True,
        )

    def run_once(self, preferences: SearchPreferences) -> DailyDigest:
        listings = self.search_service.search(preferences)
        digest = self.crew_runner.curate(preferences, listings)
        self.storage.save_digest(digest)
        return digest
