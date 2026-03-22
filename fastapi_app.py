from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import joblib
import pandas as pd

# Load the trained model
model = joblib.load("music-recommender.joblib")
INDEX_HTML = Path(__file__).with_name("index.html").read_text(encoding="utf-8")

# Initialize FastAPI
app = FastAPI(title="Music Recommender API")


# Define request body schema
class UserData(BaseModel):
    age: int
    gender: int


# Root endpoint
@app.get("/", response_class=HTMLResponse)
def read_root():
    return INDEX_HTML


@app.get("/api")
def read_api_root():
    return {"message": "Music Recommender API is running!"}


# Prediction endpoint
@app.post("/predict")
def predict(data: UserData):
    # Convert input to DataFrame with correct column names
    input_df = pd.DataFrame([data.model_dump()])
    prediction = model.predict(input_df)
    return {"prediction": prediction.tolist()}
