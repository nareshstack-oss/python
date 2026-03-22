from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

SourceName = Literal["zillow", "apartments", "rent"]


class SearchPreferences(BaseModel):
    location: str = Field(..., description="City, neighborhood, or ZIP code")
    max_budget: int = Field(..., ge=500, le=50000)
    min_beds: int = Field(default=1, ge=0, le=10)
    radius_miles: int = Field(default=5, ge=1, le=50)
    daily_time: str = Field(default="08:00", pattern=r"^\d{2}:\d{2}$")
    preferred_sources: list[SourceName] = Field(default_factory=lambda: ["zillow", "apartments", "rent"])


class RawListing(BaseModel):
    source: SourceName
    title: str
    url: HttpUrl
    snippet: str
    price_text: str = "Price unavailable"
    location_hint: str = "Location not parsed"


class ApartmentCard(BaseModel):
    name: str
    source: str
    price_text: str
    location_hint: str
    url: HttpUrl
    why_it_matches: str


class DailyDigest(BaseModel):
    generated_at: datetime
    headline: str
    summary: str
    apartments: list[ApartmentCard]
    raw_listing_count: int
    next_refresh_hint: str
