"""
rag_pipeline.py — Step 2 of the RAG pipeline
----------------------------------------------
Loads the Chroma vector store, sets up the retriever,
and wires it to an LLM to answer questions.

This module is imported by app.py — you do not run it directly.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

load_dotenv()

# ── Configuration ──────────────────────────────────────────────────────────────
VECTORSTORE_DIR = Path(os.getenv("VECTORSTORE_DIR", "./vectorstore"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "gbv_support_nigeria")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# How many document chunks to retrieve per question
TOP_K = 4
# ──────────────────────────────────────────────────────────────────────────────

# ── Prompt template ───────────────────────────────────────────────────────────
# Tells the LLM exactly how to behave 
SYSTEM_PROMPT = """You are a compassionate and knowledgeable support assistant \
for survivors of gender-based violence (GBV) in Nigeria.

Your answers are based ONLY on the provided context, which comes from official \
Nigerian laws (such as the VAPP Act), clinical guidelines, and survivor support \
documents. Do not make up information that is not in the context.

If the context does not contain enough information to answer the question, say:
"I don't have enough information in my documents to answer that. Please contact \
a support centre directly."

Always be respectful, non-judgmental, and trauma-informed. If a person appears \
to be in immediate danger, always remind them to call the emergency number 112 \
or go to the nearest hospital or police station.

Context:
{context}

Question: {question}

Answer (be clear, helpful, and compassionate):"""

PROMPT = PromptTemplate(
    template=SYSTEM_PROMPT,
    input_variables=["context", "question"],
)
# ──────────────────────────────────────────────────────────────────────────────


def load_vectorstore() -> Chroma:
    """Load the persisted Chroma vector store from disk."""
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(VECTORSTORE_DIR),
        embedding_function=embeddings,
    )
    return vectorstore


def build_llm():
    """
    Build the LLM.  Supports two options — switch by setting env vars.

    Option A (default): OpenAI  →  set OPENAI_API_KEY in .env
    Option B: Anthropic Claude  →  set ANTHROPIC_API_KEY in .env
                                   and change USE_ANTHROPIC=true in .env
    """
    use_anthropic = os.getenv("USE_ANTHROPIC", "false").lower() == "true"

    if use_anthropic:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model="claude-3-haiku-20240307",   # fast and affordable
            temperature=0.1,                   # low temperature = factual answers
            max_tokens=1024,
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gpt-4o-mini",               # affordable, accurate
            temperature=0.1,
            max_tokens=1024,
        )


def build_rag_chain() -> RetrievalQA:
    """
    Assemble the full RAG chain:
        Question → Retriever → Relevant chunks → LLM → Answer
    """
    vectorstore = load_vectorstore()
    retriever   = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": TOP_K},
    )
    llm   = build_llm()
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",                # "stuff" = concatenate all chunks into one prompt
        retriever=retriever,
        return_source_documents=True,      # so we can show which PDF the answer came from
        chain_type_kwargs={"prompt": PROMPT},
    )
    return chain


def ask(chain: RetrievalQA, question: str) -> dict:
    """
    Ask a question and return a dict with:
        - answer: the LLM's response
        - sources: list of (filename, page) tuples
    """
    result   = chain.invoke({"query": question})
    answer   = result["result"]
    sources  = []

    for doc in result.get("source_documents", []):
        meta = doc.metadata
        src  = meta.get("source", "Unknown document")
        page = meta.get("page", "?")
        entry = f"{src} (page {page})"
        if entry not in sources:
            sources.append(entry)

    return {"answer": answer, "sources": sources}
