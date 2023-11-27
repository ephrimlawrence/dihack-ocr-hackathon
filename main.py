from typing import Union, Annotated

from fastapi import FastAPI, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

# import pytesseract
from pydantic import BaseModel
from random_word import RandomWords
from google.cloud import vision
from openai import OpenAI
import os


client = vision.ImageAnnotatorClient()

# TODO: If possible, use openai to get easy to get 100 easy random words on app start
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
    # if len(word) > 3:
    #     word = word[:3]

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


@app.post("/audio")
async def decode_audio(file: Annotated[bytes, File()]):
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # Save file to "test.ogg"
    # file_object = await file()
    with open(f'test.ogg', 'wb') as fh:
        fh.write(file)

    audio_file = open("test.ogg", "rb")
    transcript = client.audio.transcriptions.create(
        model="whisper-1", file=audio_file, response_format="text"
    )
    print(transcript)

    # TODO: compare transcript to text
    # await file.close()
    # print(file.decode())

    return {"file_size": len(file)}
