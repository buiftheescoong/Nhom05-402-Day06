import logging
import re
from pathlib import Path

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> tuple[str, list[dict]]:
    """Extract text and build outline from PDF."""
    doc = fitz.open(file_path)
    full_text = ""
    outline = []

    for i, page in enumerate(doc):
        text = page.get_text()
        full_text += f"\n--- Trang {i + 1} ---\n{text}"

    toc = doc.get_toc()
    for level, title, page in toc:
        outline.append({"level": level, "title": title, "page": page})

    if not outline:
        outline = _auto_outline(full_text)

    doc.close()
    return full_text.strip(), outline


def extract_text_from_docx(file_path: str) -> tuple[str, list[dict]]:
    """Extract text and build outline from DOCX."""
    doc = DocxDocument(file_path)
    full_text = ""
    outline = []

    for para in doc.paragraphs:
        full_text += para.text + "\n"
        style = para.style.name if para.style else ""
        if "Heading" in style:
            try:
                level = int(style.replace("Heading ", "").strip())
            except ValueError:
                level = 1
            outline.append({"level": level, "title": para.text.strip(), "page": 0})

    if not outline:
        outline = _auto_outline(full_text)

    return full_text.strip(), outline


def extract_text_from_txt(file_path: str) -> tuple[str, list[dict]]:
    """Extract text from plain text file."""
    text = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    return text.strip(), _auto_outline(text)


def _auto_outline(text: str) -> list[dict]:
    """Generate a basic outline from text when none exists."""
    lines = text.split("\n")
    outline = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^(Chương|Chapter|Phần|Bài|Mục|Section)\s", stripped, re.IGNORECASE):
            outline.append({"level": 1, "title": stripped[:100], "page": 0})
        elif re.match(r"^[IVXLCDM]+\.", stripped) or re.match(r"^\d+\.\s+[A-ZĐ]", stripped):
            outline.append({"level": 2, "title": stripped[:100], "page": 0})
    if not outline:
        outline.append({"level": 1, "title": "Toàn bộ tài liệu", "page": 0})
    return outline


def extract_text(file_path: str, file_type: str) -> tuple[str, list[dict]]:
    """Route to correct extractor based on file type."""
    ext = file_type.lower()
    if ext in ("pdf", "application/pdf"):
        return extract_text_from_pdf(file_path)
    elif ext in ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        return extract_text_from_docx(file_path)
    elif ext in ("txt", "text/plain"):
        return extract_text_from_txt(file_path)
    else:
        return extract_text_from_txt(file_path)


def chunk_text(text: str) -> list[str]:
    """Split text into chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)
