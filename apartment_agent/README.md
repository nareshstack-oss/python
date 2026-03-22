# Apartment Finder Agent

This is a separate local CrewAI project for daily apartment updates.

What it does:

- accepts apartment search preferences from a UI
- searches Zillow, Apartments.com, and Rent.com through Google-style site search
- uses CrewAI with DeepSeek to curate and summarize the results
- stores the latest digest locally
- runs a daily scheduled refresh

## Important limitation

DeepSeek can summarize and rank listings, but it does not fetch live listing data by itself.

To retrieve live search results for the target sites, this project uses the Serper search API.
So for real data, you need:

- `DEEPSEEK_API_KEY`
- `SERPER_API_KEY`

## Setup

```bash
cd /Users/naresh/Desktop/PythonMaster/apartment_agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Add your keys to `.env`.

## Run

```bash
uvicorn app:app --reload --port 8010
```

Open:

- `http://localhost:8010`

## Sources

The search stage uses:

- Zillow
- Apartments.com
- Rent.com

Official references used while scaffolding:

- CrewAI installation: https://docs.crewai.com/en/installation
- CrewAI quickstart: https://docs.crewai.com/en/quickstart
- CrewAI LLM connections: https://docs.crewai.com/learn/llm-connections
- CrewAI crew output: https://docs.crewai.com/en/concepts/crews
- DeepSeek OpenAI-compatible API: https://api-docs.deepseek.com/
