from __future__ import annotations

from datetime import datetime
import os

from crewai import Agent, Crew, LLM, Process, Task
from dotenv import load_dotenv
from pydantic import BaseModel

from .models import ResumeInput, ResumeOutput
from .storage import ResumeStorage

load_dotenv()


class ResumeDraft(BaseModel):
    headline: str
    summary: str
    resume_markdown: str


class ResumeGenerator:
    def __init__(self, storage: ResumeStorage) -> None:
        self.storage = storage

    def _llm(self) -> LLM:
        api_key = os.getenv("DEEPSEEK_API_KEY", "")
        if not api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is missing. Add it to resume_agent/.env.")
        return LLM(
            model=os.getenv("DEEPSEEK_MODEL", "openai/deepseek-chat"),
            api_key=api_key,
            base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
            temperature=0.25,
        )

    def generate(self, payload: ResumeInput) -> ResumeOutput:
        llm = self._llm()

        analyst = Agent(
            role="Resume input analyst",
            goal="Extract the strongest role alignment, core skills, and experience themes from the user's input.",
            backstory="You organize raw professional information into a clean structure for resume strategy.",
            llm=llm,
            verbose=False,
        )
        strategist = Agent(
            role="Resume strategist",
            goal="Design a crisp professional resume structure tailored to the target role.",
            backstory="You know how to present skills, experience, and projects so that recruiters can scan them quickly.",
            llm=llm,
            verbose=False,
        )
        writer = Agent(
            role="Resume writer",
            goal="Write a polished resume in markdown with strong summary, skills, experience, projects, and education sections.",
            backstory="You write concise, credible, professional resumes without filler.",
            llm=llm,
            verbose=False,
        )

        analysis_task = Task(
            description=(
                "Analyze the user's resume input and identify the target role, main skill clusters, strongest project themes, "
                "and experience highlights.\n\n"
                f"User input:\n{payload.model_dump_json(indent=2)}"
            ),
            expected_output="A structured analysis of the user's professional profile.",
            agent=analyst,
        )

        strategy_task = Task(
            description=(
                "Using the previous analysis, design the strongest resume structure and messaging strategy. "
                "Decide which achievements and skills should be emphasized first for the target role."
            ),
            expected_output="A clear resume strategy for the writer.",
            agent=strategist,
            context=[analysis_task],
        )

        writing_task = Task(
            description=(
                "Write the final resume in markdown.\n"
                "Requirements:\n"
                "- professional headline\n"
                "- 3 to 5 line summary\n"
                "- skills section\n"
                "- work experience section with impactful bullets\n"
                "- projects section\n"
                "- education section\n"
                "- certifications section if provided\n"
                "- do not invent employers, dates, or achievements not grounded in the input\n"
                "- keep the tone concise and recruiter-friendly"
            ),
            expected_output="Final resume markdown and supporting summary.",
            agent=writer,
            context=[analysis_task, strategy_task],
            output_pydantic=ResumeDraft,
        )

        crew = Crew(
            agents=[analyst, strategist, writer],
            tasks=[analysis_task, strategy_task, writing_task],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff()
        draft = result.pydantic or writing_task.output.pydantic
        if not draft:
            raise RuntimeError("Resume generation failed to produce a structured result.")

        output = ResumeOutput(
            generated_at=datetime.utcnow(),
            headline=draft.headline,
            summary=draft.summary,
            resume_markdown=draft.resume_markdown,
        )
        self.storage.save_input(payload)
        self.storage.save_resume(output)
        return output
