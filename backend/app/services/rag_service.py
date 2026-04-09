import logging

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

from app.config import settings

logger = logging.getLogger(__name__)

_client: chromadb.ClientAPI | None = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client

def get_openai_ef():
    return embedding_functions.OpenAIEmbeddingFunction(
        api_key=settings.openai_api_key,
        model_name="text-embedding-3-small"
    )


def get_embedding_function():
    if settings.gemini_api_key:
        return embedding_functions.GoogleGenerativeAiEmbeddingFunction(
            api_key=settings.gemini_api_key
        )
    elif settings.openai_api_key:
        return embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key
        )
    return None


def get_collection(session_id: str) -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=f"session_{session_id}",
        metadata={"hnsw:space": "cosine"},
        embedding_function=get_embedding_function(),
    )


def add_document_chunks(session_id: str, doc_id: str, chunks: list[str]):
    """Add document chunks to the vector store."""
    if not chunks:
        return

    collection = get_collection(session_id)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]

    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    logger.info("Added %d chunks for doc %s to session %s", len(chunks), doc_id, session_id)


def query_chunks(session_id: str, query: str, n_results: int = 5, doc_id: str | None = None) -> list[dict]:
    """Query relevant chunks from the vector store."""
    collection = get_collection(session_id)

    where = {"doc_id": doc_id} if doc_id else None
    try:
        results = collection.query(query_texts=[query], n_results=n_results, where=where)
    except Exception as e:
        logger.warning("ChromaDB query failed: %s", e)
        return []

    chunks = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            chunks.append({"content": doc, "metadata": meta, "distance": distance})

    return chunks


def get_all_chunks(session_id: str, doc_id: str | None = None) -> list[str]:
    """Get all document chunks for full-content operations."""
    collection = get_collection(session_id)
    where = {"doc_id": doc_id} if doc_id else None

    try:
        results = collection.get(where=where)
    except Exception:
        return []

    return results["documents"] if results and results["documents"] else []


def delete_document_chunks(session_id: str, doc_id: str):
    """Remove all chunks for a document."""
    collection = get_collection(session_id)
    try:
        results = collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        logger.warning("Failed to delete chunks for doc %s: %s", doc_id, e)
