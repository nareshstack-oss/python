# Resume Agent

This is a separate local AI project that generates resumes from user input.

What it does:

- provides a UI form for resume input
- uses a multi-agent CrewAI workflow
- generates a polished resume in markdown
- stores the latest generated resume locally

## Inputs from UI

- full name
- phone
- email
- location
- target role
- years of experience
- skills
- projects
- work experience
- education
- certifications

## Agent flow

- Input analyst agent
- Resume strategist agent
- Resume writer agent

The app is designed to use DeepSeek through an OpenAI-compatible endpoint.

## Setup

```bash
cd /Users/naresh/Desktop/PythonMaster/resume_agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Add your DeepSeek key to `.env`.

## Run

```bash
uvicorn app:app --reload --port 8020
```

Open:

- `http://localhost:8020`

References used:

- CrewAI docs: https://docs.crewai.com/
- DeepSeek API docs: https://api-docs.deepseek.com/
