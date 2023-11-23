from openai import OpenAI
import os

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

audio_file = open("/tmp/audio_2023-11-21_08-04-07.ogg", "rb")
transcript = client.audio.transcriptions.create(
    model="whisper-1", file=audio_file, response_format="text"
)

print(transcript)
