from __future__ import annotations

from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "src"))

from resume_agent.exporters import docx_bytes, markdown_bytes, pdf_bytes, txt_bytes  # noqa: E402
from resume_agent.models import ResumeInput, ResumeOutput  # noqa: E402
from resume_agent.runner import ResumeGenerator  # noqa: E402
from resume_agent.storage import ResumeStorage  # noqa: E402

app = FastAPI(title="Resume Agent")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
storage = ResumeStorage(BASE_DIR / "data")
generator = ResumeGenerator(storage)


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": "Resume Agent",
        },
    )


@app.get("/api/state")
def state() -> dict:
    return {
        "latest_resume": storage.load_latest_resume(),
        "latest_input": storage.load_latest_input(),
    }


@app.post("/api/generate")
def generate_resume(payload: ResumeInput) -> ResumeOutput:
    try:
        return generator.generate(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/download/{file_format}")
def download_resume(file_format: str) -> Response:
    resume = storage.load_latest_resume()
    if not resume:
        raise HTTPException(status_code=404, detail="Generate a resume first.")

    safe_name = storage.safe_filename_prefix(resume.headline)
    if file_format == "md":
        return Response(
            content=markdown_bytes(resume),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.md"'},
        )
    if file_format == "txt":
        return Response(
            content=txt_bytes(resume),
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.txt"'},
        )
    if file_format == "docx":
        return Response(
            content=docx_bytes(resume),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
        )
    if file_format == "pdf":
        return Response(
            content=pdf_bytes(resume),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
        )

    raise HTTPException(status_code=400, detail="Unsupported format. Use md, txt, docx, or pdf.")
