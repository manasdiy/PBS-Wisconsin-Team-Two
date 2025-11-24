from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os, shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
DESKTOP_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "EditedFiles")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DESKTOP_DIR, exist_ok=True)

@app.get("/")
def home():
    return {"message": "FastAPI is running and ready to accept uploads!"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"message": "File uploaded successfully!", "filename": file.filename}

@app.get("/files/")
def list_files():
    files = os.listdir(UPLOAD_DIR)
    return {"files": files}

@app.post("/save-edited/")
async def save_edited_file(file: UploadFile = File(...)):
    save_path = os.path.join(DESKTOP_DIR, file.filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": f"File saved to Desktop/EditedFiles/{file.filename}"}
