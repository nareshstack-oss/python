from __future__ import annotations

import os
import re
from collections import OrderedDict

import httpx
from dotenv import load_dotenv

from .models import RawListing, SearchPreferences

DOMAIN_MAP = {
    "zillow": "zillow.com",
    "apartments": "apartments.com",
    "rent": "rent.com",
}

PRICE_PATTERN = re.compile(r"\$\s?\d[\d,]*")
LOCATION_PATTERN = re.compile(r"([A-Z][a-zA-Z]+(?:,\s*[A-Z]{2})?)")

load_dotenv()


class SearchService:
    def __init__(self) -> None:
        self.serper_api_key = os.getenv("SERPER_API_KEY", "")

    def search(self, preferences: SearchPreferences) -> list[RawListing]:
        if not self.serper_api_key:
            raise RuntimeError(
                "SERPER_API_KEY is missing. Add it to apartment_agent/.env to fetch live listing search results."
            )

        listings: list[RawListing] = []
        for source in preferences.preferred_sources:
            query = self._build_query(source, preferences)
            response = httpx.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": self.serper_api_key,
                    "Content-Type": "application/json",
                },
                json={"q": query, "num": 8},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            for item in data.get("organic", []):
                text = f"{item.get('title', '')} {item.get('snippet', '')}"
                listings.append(
                    RawListing(
                        source=source,
                        title=item.get("title", "Untitled listing"),
                        url=item["link"],
                        snippet=item.get("snippet", ""),
                        price_text=self._extract_price(text),
                        location_hint=self._extract_location(text, preferences.location),
                    )
                )

        return self._dedupe(listings)

    def _build_query(self, source: str, preferences: SearchPreferences) -> str:
        domain = DOMAIN_MAP[source]
        beds = f"{preferences.min_beds}+ bedroom" if preferences.min_beds else "studio or 1 bedroom"
        return (
            f"site:{domain} apartments for rent {preferences.location} "
            f"under ${preferences.max_budget} {beds} within {preferences.radius_miles} miles"
        )

    def _extract_price(self, text: str) -> str:
        match = PRICE_PATTERN.search(text)
        return match.group(0) if match else "Price unavailable"

    def _extract_location(self, text: str, fallback: str) -> str:
        match = LOCATION_PATTERN.search(text)
        return match.group(1) if match else fallback

    def _dedupe(self, listings: list[RawListing]) -> list[RawListing]:
        seen: OrderedDict[str, RawListing] = OrderedDict()
        for listing in listings:
            seen.setdefault(str(listing.url), listing)
        return list(seen.values())
