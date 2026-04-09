from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import get_db, Notebook
from app.models.schemas import NotebookCreate, NotebookResponse

router = APIRouter()


@router.post("", response_model=NotebookResponse)
def create_notebook(body: NotebookCreate, db: Session = Depends(get_db)):
    nb = Notebook(title=body.title)
    db.add(nb)
    db.commit()
    db.refresh(nb)
    return NotebookResponse(
        id=nb.id,
        title=nb.title,
        created_at=nb.created_at,
        updated_at=nb.updated_at,
        source_count=0,
    )


@router.get("", response_model=list[NotebookResponse])
def list_notebooks(db: Session = Depends(get_db)):
    notebooks = db.query(Notebook).order_by(Notebook.updated_at.desc()).all()
    return [
        NotebookResponse(
            id=nb.id,
            title=nb.title,
            created_at=nb.created_at,
            updated_at=nb.updated_at,
            source_count=len(nb.documents),
        )
        for nb in notebooks
    ]


@router.get("/{notebook_id}", response_model=NotebookResponse)
def get_notebook(notebook_id: str, db: Session = Depends(get_db)):
    nb = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(404, "Notebook not found")
    return NotebookResponse(
        id=nb.id,
        title=nb.title,
        created_at=nb.created_at,
        updated_at=nb.updated_at,
        source_count=len(nb.documents),
    )


@router.put("/{notebook_id}")
def update_notebook(notebook_id: str, body: NotebookCreate, db: Session = Depends(get_db)):
    nb = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(404, "Notebook not found")
    nb.title = body.title
    db.commit()
    return {"ok": True}


@router.delete("/{notebook_id}")
def delete_notebook(notebook_id: str, db: Session = Depends(get_db)):
    nb = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(404, "Notebook not found")
    db.delete(nb)
    db.commit()
    return {"ok": True}
