from __future__ import annotations

from datetime import datetime
import json
import os

from crewai import Agent, Crew, LLM, Process, Task
from dotenv import load_dotenv
from pydantic import BaseModel, HttpUrl

from .models import ApartmentCard, DailyDigest, RawListing, SearchPreferences

load_dotenv()


class ApartmentCardOutput(BaseModel):
    name: str
    source: str
    price_text: str
    location_hint: str
    url: HttpUrl
    why_it_matches: str


class DailyDigestOutput(BaseModel):
    headline: str
    summary: str
    apartments: list[ApartmentCardOutput]


class ApartmentCrewRunner:
    def __init__(self) -> None:
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.deepseek_model = os.getenv("DEEPSEEK_MODEL", "openai/deepseek-chat")

    def _llm(self) -> LLM:
        if not self.deepseek_api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is missing. Add it to apartment_agent/.env.")
        return LLM(
            model=self.deepseek_model,
            api_key=self.deepseek_api_key,
            base_url=self.deepseek_base_url,
            temperature=0.2,
        )

    def curate(self, preferences: SearchPreferences, listings: list[RawListing]) -> DailyDigest:
        if not listings:
            return DailyDigest(
                generated_at=datetime.utcnow(),
                headline=f"No current listing results found for {preferences.location}",
                summary="The search ran successfully but did not return any matching listings.",
                apartments=[],
                raw_listing_count=0,
                next_refresh_hint=f"Daily refresh scheduled at {preferences.daily_time}.",
            )

        llm = self._llm()
        researcher = Agent(
            role="Apartment listing researcher",
            goal="Normalize noisy search results into candidate apartments that fit the user's budget and bedroom needs.",
            backstory="You are careful with listing data and never invent prices or addresses that were not present in the search results.",
            llm=llm,
            verbose=False,
        )
        curator = Agent(
            role="Neighborhood rental advisor",
            goal="Select the strongest apartment options and explain why each one matches the user's preferences.",
            backstory="You create concise, trustworthy apartment digests for renters reviewing daily updates.",
            llm=llm,
            verbose=False,
        )

        shortlist_task = Task(
            description=(
                "You are given raw apartment search results from Zillow, Apartments.com, and Rent.com.\n"
                f"User preferences:\n{preferences.model_dump_json(indent=2)}\n\n"
                f"Raw search results:\n{json.dumps([item.model_dump(mode='json') for item in listings], indent=2)}\n\n"
                "Filter out obvious duplicates and weak matches. Keep only listings that plausibly fit the budget and bedroom needs. "
                "Preserve only information present in the input."
            ),
            expected_output="A cleaned shortlist for the apartment curator.",
            agent=researcher,
        )

        digest_task = Task(
            description=(
                "Using the cleaned shortlist from the previous task, produce a daily apartment digest.\n"
                "Return a concise headline, one-paragraph summary, and up to 6 apartment cards.\n"
                "Each card must include: name, source, price_text, location_hint, url, why_it_matches.\n"
                "Do not invent prices or locations. If price is missing, keep 'Price unavailable'."
            ),
            expected_output="Structured apartment digest JSON.",
            agent=curator,
            output_pydantic=DailyDigestOutput,
            context=[shortlist_task],
        )

        crew = Crew(
            agents=[researcher, curator],
            tasks=[shortlist_task, digest_task],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff()
        payload = result.pydantic or digest_task.output.pydantic
        if not payload:
            raise RuntimeError("CrewAI did not return a structured apartment digest.")

        return DailyDigest(
            generated_at=datetime.utcnow(),
            headline=payload.headline,
            summary=payload.summary,
            apartments=[ApartmentCard(**item.model_dump()) for item in payload.apartments],
            raw_listing_count=len(listings),
            next_refresh_hint=f"Daily refresh scheduled at {preferences.daily_time}.",
        )
