# Chatbot Evaluation Methodology

Companion to [`CHATBOT_INTEGRATION_PLAN.md`](CHATBOT_INTEGRATION_PLAN.md) §7 —
this document covers what actually got built for offline evaluation, why it
diverges from the plan's literal library suggestion, and how to run it.

## Why not the `ragas` library

The plan names RAGAS as the recommended evaluation library. `ragas`'s
non-optional dependency tree includes `langchain`, `langchain-core`,
`langchain-community`, `langchain_openai`, `openai`, `instructor`, and
`tiktoken` — installed even though this project never calls OpenAI (every
LLM call goes through Groq or Gemini via `LLMProvider`) and has no
LangChain anywhere else in the codebase. Overriding RAGAS's `evaluator_llm`
and embeddings to point at Groq/Gemini and the local `sentence-transformers`
model is possible (`LangchainLLMWrapper`/`LangchainEmbeddingsWrapper`), but
`openai`/`langchain_openai` still ship as dead weight in every install —
a real inconsistency with a codebase that otherwise treats every dependency
addition as a deliberate cost (see `requirements.txt`'s own comments on the
CPU-only torch wheel).

Instead, `app/services/chat/evaluation.py` implements RAGAS's own four
published metric definitions directly against this project's existing
`LLMProvider` abstraction and local embedding model — same methodology,
no added dependency footprint.

## The four metrics

| Metric | What it measures | How it's computed here |
|---|---|---|
| **Context precision** | Of the chunks retrieval actually handed to generation, what fraction were relevant? | Local overlap score (`guardrails.local_faithfulness_score` — the max of lexical Jaccard and embedding cosine similarity) between each retrieved item and the ground-truth answer, thresholded at `chat_faithfulness_overlap_threshold` (default 0.6). |
| **Context recall** | Did the retrieved set contain *enough* to answer correctly at all? | 1.0 if any retrieved item clears that same threshold against the ground truth, else 0.0. |
| **Faithfulness** | Is the generated answer actually grounded, not hallucinated? | 1.0 for any non-`insufficient_information` answer, 0.0 otherwise. Every citation on a non-insufficient `ChatAnswer` has already individually passed `generation.py`'s own faithfulness guardrail (local overlap, escalating borderline sentences to a batched LLM-judge call) before that answer could exist — there's nothing left to re-score post hoc; what varies, and what this metric reports, is how often the pipeline found groundable evidence instead of declining. |
| **Answer relevancy** | Does the answer actually address the question asked? | Cosine similarity between the question's and the answer's embeddings. RAGAS's own approach synthesizes several reverse-engineered questions from the answer via an LLM call and averages their similarity to the original — this project uses a single direct embedding comparison instead, avoiding an extra LLM call on every evaluated question, consistent with the same cost discipline the faithfulness guardrail already follows (cheap local check first, LLM only when it's actually needed). |

None of the four require a real LLM call except the pipeline turn itself
(and faithfulness's occasional judge escalation, already covered by that
guardrail) — evaluation costs exactly what running the chatbot on those
questions would have cost anyway.

## The evaluation set

`scripts/run_rag_evaluation.py` builds its question set from the real CUAD
v1 dataset (CC BY 4.0), not synthetic data — but scoped to whatever
organization you point it at (default: the demo org from
`scripts/seed_demo_data.py`), sampling only CUAD question/answer pairs
whose source contract is actually present in that org's own
`contract_chunks`. A question about a contract the org never uploaded
isn't a fair test of retrieval — there's nothing to retrieve.

Questions are phrased as natural-language questions ("What does this
contract say about cap on liability?"), not CUAD's own
"Highlight the parts (if any) of this contract related to..." template —
that template is a span-extraction prompt, a different task than what the
chatbot does.

Sampling round-robins across CUAD's ~41 categories rather than taking the
first N rows outright, which would otherwise skew heavily toward whichever
category happens to sort first alphabetically among a given org's
contracts.

A future iteration could add a small hand-written question set covering
calendar-query and out-of-scope phrasing (CUAD-derived questions are all
domain-question by construction, since they're literally about contract
clause content) — not built yet; intent-routing accuracy for those two
paths is currently covered by `tests/services/chat/test_intent.py` and
`tests/services/chat/test_pipeline.py` instead.

## Running it

```bash
cd backend
python -m scripts.seed_demo_data --demo   # if you haven't already
python -m scripts.build_cuad_reference_corpus  # populates the clause-benchmark corpus too
python -m scripts.run_rag_evaluation
python -m scripts.run_rag_evaluation --org-name "Demo Legal Ops" --sample-size 40
```

Results print to stdout and persist to `.rag_eval_results.json` at the repo
root (git-ignored) — `GET /api/v1/chat/admin/evaluation-summary` reads the
latest run from there alongside live feedback/insufficient-information
stats, for the admin quality view the plan describes in §7.

## CI status: not currently a real gate

The plan asks for "a CI job [that] runs the evaluation set... and fails the
build if scores regress below threshold." The CI workflow includes a step
for this (`.github/workflows/ci.yml`), but it's a no-op on every run today,
for two structural reasons neither of which this project can fix
unilaterally:

- **No dataset.** `data/` (the CUAD corpus) is git-ignored per
  `data/README.md` and never checked out in CI.
- **No LLM keys.** `GROQ_API_KEY`/`GEMINI_API_KEY` are the developer's own
  account credentials — not something to hand to a shared build pipeline
  without a deliberate decision (and cost) a maintainer has to make.

`run_rag_evaluation.py` detects both conditions and skips cleanly (exit 0,
no results written) rather than erroring — the CI step exists as real,
runnable infrastructure and documents the intended gate, but actually
enforcing it needs a maintainer to provision the dataset (e.g. cached in
CI) and API key secrets first. Until then, run it manually before a
release, per the commands above.

## Suggested thresholds

Not yet calibrated against a large enough sample to set with confidence —
run the harness against your own seeded data and real provider keys first
to see where this pipeline actually lands before picking numbers to gate
on. As a starting point once real numbers exist: faithfulness and context
precision are the metrics most worth gating strictly (a regression there
means the system started answering with weaker grounding, exactly what
plan §12's acceptance criteria call out as the failure mode this whole
module exists to prevent); answer relevancy and context recall are useful
trend signals but noisier at small sample sizes.
