import asyncio
import logging

from app.config import settings
from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks, get_all_chunks
from app.prompts.summary import (
    SUMMARY_SYSTEM,
    SUMMARY_PROMPT,
    SECTION_SUMMARY_SYSTEM,
    SECTION_SUMMARY_PROMPT,
    MERGE_SUMMARY_SYSTEM,
    MERGE_SUMMARY_PROMPT,
)

logger = logging.getLogger(__name__)

EMPTY_RESULT = {
    "key_points": ["Không tìm thấy nội dung để tóm tắt"],
    "summary": "Tài liệu chưa được tải lên hoặc chưa được xử lý.",
    "confidence": 0.0,
}


def _batch_chunks(chunks: list[str], batch_size: int) -> list[list[str]]:
    """Split a list of chunks into fixed-size batches."""
    return [chunks[i : i + batch_size] for i in range(0, len(chunks), batch_size)]


async def _summarise_section(
    section_content: str,
    section_num: int,
    total_sections: int,
) -> dict:
    """Map phase: summarise a single section of chunks."""
    prompt = SECTION_SUMMARY_PROMPT.format(
        section_num=section_num,
        total_sections=total_sections,
        content=section_content[: settings.summary_max_content_per_batch],
    )
    try:
        result = await llm_router.generate_json(prompt, system=SECTION_SUMMARY_SYSTEM)
        return {
            "key_points": result.get("key_points", []),
            "section_summary": result.get("section_summary", ""),
        }
    except Exception as e:
        logger.warning("Section %d/%d summary failed: %s", section_num, total_sections, e)
        return {"key_points": [], "section_summary": ""}


async def _map_reduce_summary(chunks: list[str], scope: str) -> dict:
    """Full Map-Reduce pipeline for long documents."""
    batch_size = settings.summary_batch_size
    batches = _batch_chunks(chunks, batch_size)
    total_sections = len(batches)

    logger.info(
        "[Summary MapReduce] %d chunks -> %d sections (batch_size=%d)",
        len(chunks),
        total_sections,
        batch_size,
    )

    # --- Map phase: summarise each section concurrently ---
    tasks = []
    for idx, batch in enumerate(batches, start=1):
        content = "\n\n".join(batch)
        tasks.append(_summarise_section(content, idx, total_sections))

    section_results = await asyncio.gather(*tasks)

    # --- Build input for Reduce phase ---
    section_texts = []
    for idx, sec in enumerate(section_results, start=1):
        points = "\n".join(f"  - {p}" for p in sec["key_points"]) if sec["key_points"] else "  (không có)"
        section_texts.append(
            f"### Phần {idx}/{total_sections}\n"
            f"**Ý chính:**\n{points}\n"
            f"**Tóm tắt:** {sec['section_summary']}"
        )

    merged_sections = "\n\n".join(section_texts)

    # --- Reduce phase: merge into final summary ---
    merge_prompt = MERGE_SUMMARY_PROMPT.format(
        total_sections=total_sections,
        section_summaries=merged_sections,
    )

    try:
        result = await llm_router.generate_json(merge_prompt, system=MERGE_SUMMARY_SYSTEM)
        return {
            "key_points": result.get("key_points", []),
            "summary": result.get("summary", ""),
            "confidence": float(result.get("confidence", 0.8)),
        }
    except Exception as e:
        logger.error("Merge summary failed: %s", e)
        all_points = [p for sec in section_results for p in sec["key_points"]]
        all_summaries = " ".join(sec["section_summary"] for sec in section_results if sec["section_summary"])
        return {
            "key_points": all_points[:10],
            "summary": all_summaries,
            "confidence": 0.5,
        }


async def _single_pass_summary(content: str, scope: str) -> dict:
    """Original single-pass summary for short documents."""
    prompt = SUMMARY_PROMPT.format(scope=scope, content=content[:8000])
    result = await llm_router.generate_json(prompt, system=SUMMARY_SYSTEM)
    return {
        "key_points": result.get("key_points", []),
        "summary": result.get("summary", ""),
        "confidence": float(result.get("confidence", 0.8)),
    }


async def generate_summary(
    session_id: str,
    document_id: str | None = None,
    scope: str = "full",
) -> dict:
    """Generate a structured summary from document content."""

    if scope == "full":
        chunks = get_all_chunks(session_id, document_id)
    else:
        raw = query_chunks(session_id, scope, n_results=10, doc_id=document_id)
        chunks = [c["content"] for c in raw]

    if not chunks or not any(c.strip() for c in chunks):
        return EMPTY_RESULT

    content = "\n\n".join(chunks)
    is_short = len(chunks) <= 20 and len(content) <= 8000

    try:
        if is_short:
            logger.info("[Summary] Short doc (%d chunks, %d chars) -> single pass", len(chunks), len(content))
            return await _single_pass_summary(content, scope)
        else:
            logger.info("[Summary] Long doc (%d chunks, %d chars) -> Map-Reduce", len(chunks), len(content))
            return await _map_reduce_summary(chunks, scope)
    except Exception as e:
        logger.error("Summary generation failed: %s", e)
        return {
            "key_points": ["Lỗi khi tạo tóm tắt"],
            "summary": f"Không thể tạo tóm tắt: {e}",
            "confidence": 0.0,
        }
