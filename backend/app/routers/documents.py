import os
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import get_db, Document, Notebook
from app.models.schemas import DocumentResponse
from app.services.document_processor import extract_text, chunk_text
from app.services.rag_service import add_document_chunks, delete_document_chunks

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "doc"}


def _get_ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    notebook_id: str = Form(...),
    db: Session = Depends(get_db),
):
    nb = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(404, "Notebook not found")

    ext = _get_ext(file.filename or "file.txt")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    file_id = uuid.uuid4().hex[:12]
    save_name = f"{file_id}.{ext}"
    save_path = os.path.join(settings.upload_dir, save_name)

    os.makedirs(settings.upload_dir, exist_ok=True)
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    doc = Document(
        id=file_id,
        notebook_id=notebook_id,
        filename=file.filename or "document",
        file_type=ext,
        status="processing",
    )
    db.add(doc)
    db.commit()

    try:
        text, outline = extract_text(save_path, ext)
        chunks = chunk_text(text)
        add_document_chunks(notebook_id, file_id, chunks)

        doc.content_text = text
        doc.outline_json = outline
        doc.status = "ready"
        db.commit()
        db.refresh(doc)
    except Exception as e:
        logger.error("Document processing failed: %s", e)
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        notebook_id=doc.notebook_id,
        filename=doc.filename,
        file_type=doc.file_type,
        status=doc.status,
        outline=doc.outline_json or [],
        error_message=doc.error_message or "",
        created_at=doc.created_at,
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentResponse(
        id=doc.id,
        notebook_id=doc.notebook_id,
        filename=doc.filename,
        file_type=doc.file_type,
        status=doc.status,
        outline=doc.outline_json or [],
        error_message=doc.error_message or "",
        created_at=doc.created_at,
    )


@router.get("/notebook/{notebook_id}", response_model=list[DocumentResponse])
def list_documents(notebook_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.notebook_id == notebook_id).order_by(Document.created_at.desc()).all()
    return [
        DocumentResponse(
            id=d.id,
            notebook_id=d.notebook_id,
            filename=d.filename,
            file_type=d.file_type,
            status=d.status,
            outline=d.outline_json or [],
            error_message=d.error_message or "",
            created_at=d.created_at,
        )
        for d in docs
    ]


@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    delete_document_chunks(doc.notebook_id, doc_id)

    file_path = os.path.join(settings.upload_dir, f"{doc_id}.{doc.file_type}")
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"ok": True}
