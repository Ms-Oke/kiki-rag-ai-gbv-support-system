"""
ingest.py — Step 1 of the RAG pipeline
----------------------------------------
Loads all PDFs from the data/ folder, splits them into chunks,
generates embeddings, and stores everything in a local Chroma vector database.

Run this ONCE before starting the chatbot:
    python src/ingest.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm

# LangChain document loaders and splitters
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Embeddings — using a free local model (no API key required for this step)
from langchain_community.embeddings import HuggingFaceEmbeddings

# Vector store
from langchain_chroma import Chroma

load_dotenv()

# ── Configuration ──────────────────────────────────────────────────────────────
DATA_DIR        = Path(os.getenv("DATA_DIR", "./data"))
VECTORSTORE_DIR = Path(os.getenv("VECTORSTORE_DIR", "./vectorstore"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "gbv_support_nigeria")

# Chunk settings — 1 000 chars with 200-char overlap keeps context across chunks
CHUNK_SIZE    = 1000
CHUNK_OVERLAP = 200

# Free local embedding model (downloads ~90 MB on first run, then cached)
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# ──────────────────────────────────────────────────────────────────────────────


def load_pdfs(data_dir: Path) -> list:
    """Load every PDF in data_dir and return a flat list of LangChain Documents."""
    pdf_files = list(data_dir.glob("*.pdf"))

    if not pdf_files:
        print(f"\n❌  No PDF files found in '{data_dir.resolve()}'")
        print("    Please add your PDFs to the data/ folder and run this script again.")
        sys.exit(1)

    print(f"\n📂  Found {len(pdf_files)} PDF(s) in {data_dir.resolve()}:")
    for f in pdf_files:
        print(f"    • {f.name}")

    all_docs = []
    for pdf_path in tqdm(pdf_files, desc="Loading PDFs"):
        loader = PyPDFLoader(str(pdf_path))
        docs   = loader.load()
        # Tag each page with its source filename so we can cite it later
        for doc in docs:
            doc.metadata["source"] = pdf_path.name
        all_docs.extend(docs)

    print(f"\n✅  Loaded {len(all_docs)} pages total.")
    return all_docs


def split_documents(docs: list) -> list:
    """Split pages into smaller chunks for more precise retrieval."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    print(f"✂️   Split into {len(chunks)} chunks "
          f"(size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}).")
    return chunks


def build_vectorstore(chunks: list) -> Chroma:
    """Generate embeddings and persist the Chroma vector database."""
    print(f"\n🤖  Loading embedding model: {EMBEDDING_MODEL}")
    print("    (First run downloads ~90 MB — subsequent runs use the cache.)")

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},          # use "cuda" if you have a GPU
        encode_kwargs={"normalize_embeddings": True},
    )

    print(f"\n💾  Building Chroma vector store → {VECTORSTORE_DIR.resolve()}")
    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=str(VECTORSTORE_DIR),
    )

    print(f"✅  Vector store created with {vectorstore._collection.count()} vectors.")
    return vectorstore


def main():
    print("=" * 60)
    print("  GBV Support System — Document Ingestion")
    print("=" * 60)

    docs   = load_pdfs(DATA_DIR)
    chunks = split_documents(docs)
    build_vectorstore(chunks)

    print("\n🎉  Ingestion complete!")
    print("    You can now run the chatbot:  streamlit run src/app.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
