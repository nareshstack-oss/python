from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ResumeInput(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=5)
    email: EmailStr
    location: str = Field(..., min_length=2)
    target_role: str = Field(..., min_length=2)
    years_of_experience: str = Field(..., min_length=1)
    skills: str = Field(..., min_length=2)
    projects: str = Field(..., min_length=2)
    work_experience: str = Field(..., min_length=2)
    education: str = Field(..., min_length=2)
    certifications: str = ""


class ResumeOutput(BaseModel):
    generated_at: datetime
    headline: str
    summary: str
    resume_markdown: str
