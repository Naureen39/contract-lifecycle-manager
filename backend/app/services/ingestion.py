"""Orchestrates parsing + chunking + pre-filtering + embedding + LLM
extraction for one contract, end to end.

Runs synchronously inside the upload request: parsing/chunking/embedding is
fast, CPU-only, local work with no network calls (the embedding model runs
on-device), and the LLM extraction call at the end is a single batched
request per contract (docs/CONTRACT_CLM_BUILD_PLAN.md §3 step 4) rather than
one per paragraph, so it stays well within request-timeout budgets. If no
provider currently has quota headroom, extract_contract_obligations leaves
extraction_job.status as QUEUED instead of failing the request — see
retry_queued_extractions below for the sweep that picks those back up.
"""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.concurrency import run_in_threadpool

from app.db.enums import ContractStatus, ExtractionJobStatus
from app.db.models import Contract, ContractChunk, ExtractionJob, Obligation
from app.services.category_reference import passes_semantic_filter
from app.services.document_parser import parse_document
from app.services.embeddings import embed_texts
from app.services.file_validation import FileKind
from app.services.llm.extraction import extract_contract_obligations
from app.services.prefilter import classify_chunk

logger = logging.getLogger(__name__)


async def ingest_contract_document(
    db: AsyncSession,
    *,
    contract: Contract,
    extraction_job: ExtractionJob,
    file_kind: FileKind,
    data: bytes,
) -> None:
    extraction_job.status = ExtractionJobStatus.RUNNING
    extraction_job.started_at = datetime.now(UTC)
    await db.flush()

    try:
        paragraphs = parse_document(data, file_kind)
    except Exception as exc:  # parsing a hostile/corrupt file must not 500
        extraction_job.status = ExtractionJobStatus.FAILED
        extraction_job.error_message = f"Failed to parse document: {exc}"
        extraction_job.finished_at = datetime.now(UTC)
        contract.status = ContractStatus.ERROR
        await db.flush()
        return

    chunks: list[ContractChunk] = []
    candidate_texts: list[str] = []
    candidate_chunk_indices: list[int] = []

    for paragraph in paragraphs:
        is_boilerplate, passed_prefilter = classify_chunk(
            section_heading=paragraph.section_heading, raw_text=paragraph.raw_text
        )
        chunk = ContractChunk(
            contract_id=contract.id,
            paragraph_index=paragraph.paragraph_index,
            section_heading=paragraph.section_heading,
            raw_text=paragraph.raw_text,
            is_boilerplate=is_boilerplate,
            passed_prefilter=passed_prefilter,
        )
        chunks.append(chunk)
        if passed_prefilter:
            candidate_chunk_indices.append(len(chunks) - 1)
            candidate_texts.append(paragraph.raw_text)

    # Stage 2 (still zero LLM cost): embed only the stage-1 survivors, and
    # log how many of those also clear the semantic-similarity bar — a
    # preview of how much further Phase 5's batch to the LLM will shrink.
    if candidate_texts:
        embeddings = await run_in_threadpool(embed_texts, candidate_texts)
        semantic_hits = 0
        for chunk_index, embedding in zip(candidate_chunk_indices, embeddings, strict=True):
            chunks[chunk_index].embedding = embedding
            if passes_semantic_filter(embedding):
                semantic_hits += 1
        logger.info(
            "contract %s: %d/%d paragraphs passed the regex pre-filter; "
            "%d/%d of those also passed the semantic filter",
            contract.id,
            len(candidate_texts),
            len(paragraphs),
            semantic_hits,
            len(candidate_texts),
        )

    db.add_all(chunks)
    await db.flush()

    await extract_contract_obligations(db, contract=contract, extraction_job=extraction_job)


@dataclass
class ExtractionRetryResult:
    jobs_retried: int = 0
    jobs_succeeded: int = 0
    jobs_still_queued: int = 0


async def retry_queued_extractions(session: AsyncSession) -> ExtractionRetryResult:
    """Picks back up every extraction_job still QUEUED — left that way by
    extract_contract_obligations when no provider had headroom on the first
    attempt. A cache-hit obligation can already have been persisted for some
    of the contract's chunks before that happened, so any prior obligations
    for the contract are discarded first: extract_contract_obligations
    re-processes every candidate chunk from scratch, and without this a
    retry would duplicate those cache-hit rows.
    """
    result = await session.execute(
        select(ExtractionJob)
        .where(ExtractionJob.status == ExtractionJobStatus.QUEUED)
        .options(selectinload(ExtractionJob.contract))
    )
    outcome = ExtractionRetryResult()
    for job in result.scalars().all():
        outcome.jobs_retried += 1
        await session.execute(delete(Obligation).where(Obligation.contract_id == job.contract_id))
        job.status = ExtractionJobStatus.RUNNING
        job.started_at = datetime.now(UTC)
        await session.flush()
        await extract_contract_obligations(session, contract=job.contract, extraction_job=job)
        if job.status == ExtractionJobStatus.SUCCEEDED:
            outcome.jobs_succeeded += 1
        else:
            outcome.jobs_still_queued += 1

    await session.flush()
    return outcome
