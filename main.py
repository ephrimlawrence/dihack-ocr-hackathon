import base64
from typing import Union, Annotated

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

# import pytesseract
from pydantic import BaseModel
from random_word import RandomWords
from string import ascii_lowercase
from random import randrange
from google.cloud import vision

client = vision.ImageAnnotatorClient()

r = RandomWords()


class Drawing(BaseModel):
    image: str
    words: str | None = None


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://sbcimpact.amplio.org",
    "https://sbcimpact.amplio.org/",
    "https://*.amplio.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/words")
def get_words():
    # return {"words": ascii_lowercase[randrange(len(ascii_lowercase))]}

    word = r.get_random_word()
    if len(word) > 3:
        word = word[:3]

    return {"words": word}


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        "index.html", {"request": request, "id": "4555 55", "para": "1234"}
    )


@app.post("/ocr")
def read_item(body: Drawing):
    if body.image.startswith("data:"):
        _, data = body.image.split(",", 1)

        response = client.annotate_image(
            {
                "image": {"content": data},
                "features": [{"type_": vision.Feature.Type.TEXT_DETECTION}],
            }
        )

        detected_text = ""
        if len(response.text_annotations) > 0:
            detected_text = response.text_annotations[0].description

        print("Detected text:", detected_text)

        return {"words": detected_text}

    return {"words": body.words}
