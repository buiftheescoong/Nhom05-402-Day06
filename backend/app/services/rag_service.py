import logging
import re

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
    ef = get_embedding_function()
    name = f"session_{session_id}"
    try:
        return client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=ef,
        )
    except ValueError:
        logger.warning("Embedding function conflict for %s, using persisted config", name)
        return client.get_collection(name=name)


def add_document_chunks(session_id: str, doc_id: str, chunks: list[str]):
    """Add document chunks to the vector store."""
    if not chunks:
        return

    collection = get_collection(session_id)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]

    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    logger.info("Added %d chunks for doc %s to session %s", len(chunks), doc_id, session_id)


def _is_overview_query(query: str) -> bool:
    """Check if query is asking about document structure/overview."""
    overview_keywords = [
        "bao gồm", "phần nào", "cấu trúc", "tóm tắt", "tổng quan",
        "gồm những", "có gì", "overview", "structure", "chương",
        "mục lục", "phân loại", "các phần", "nội dung chính",
        "tài liệu này", "về cái gì", "nói về", "giới thiệu",
        "xin chào", "hello", "hi ", "làm quen",
    ]
    q_lower = query.lower()
    return any(kw in q_lower for kw in overview_keywords)


def query_chunks(session_id: str, query: str, n_results: int = 5, doc_id: str | None = None) -> list[dict]:
    """Query relevant chunks from the vector store.
    
    For overview/structure queries, always include the first chunk (intro/outline).
    """
    collection = get_collection(session_id)

    where = {"doc_id": doc_id} if doc_id else None

    # For overview queries, fetch the first chunk of each doc to get intro/structure
    first_chunk = None
    if _is_overview_query(query):
        try:
            all_results = collection.get(
                where=where,
                include=["documents", "metadatas"],
            )
            if all_results and all_results["documents"]:
                # Get the chunk with index 0 (first chunk = usually intro/outline)
                for doc, meta in zip(all_results["documents"], all_results["metadatas"]):
                    if meta.get("chunk_index", 999) == 0:
                        first_chunk = {
                            "content": doc,
                            "metadata": meta,
                            "distance": 0,
                        }
                        break
        except Exception as e:
            logger.warning("Failed to fetch first chunk for overview query: %s", e)

    try:
        results = collection.query(query_texts=[query], n_results=n_results, where=where)
    except Exception as e:
        logger.warning("ChromaDB query failed: %s", e)
        if first_chunk:
            return [first_chunk]
        return []

    chunks = []
    if results and results["documents"]:
        seen_ids = set()
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            chunk_id = meta.get("doc_id", "") + "_" + str(meta.get("chunk_index", i))
            if chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                chunks.append({"content": doc, "metadata": meta, "distance": distance})

    # Prepend first chunk if it's an overview query and not already included
    if first_chunk and first_chunk not in chunks:
        chunks.insert(0, first_chunk)

    return chunks[:n_results + 1]  # Allow +1 for first chunk


def get_all_chunks(session_id: str, doc_id: str | None = None) -> list[str]:
    """Get all document chunks for full-content operations, sorted by chunk_index."""
    collection = get_collection(session_id)
    where = {"doc_id": doc_id} if doc_id else None

    try:
        results = collection.get(where=where, include=["documents", "metadatas"])
    except Exception:
        return []

    if not results or not results["documents"]:
        return []

    pairs = list(zip(results["documents"], results["metadatas"]))
    pairs.sort(key=lambda p: p[1].get("chunk_index", 0))
    return [doc for doc, _ in pairs]


def delete_document_chunks(session_id: str, doc_id: str):
    """Remove all chunks for a document."""
    collection = get_collection(session_id)
    try:
        results = collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        logger.warning("Failed to delete chunks for doc %s: %s", doc_id, e)
