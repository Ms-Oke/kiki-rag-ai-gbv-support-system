# 🌸 AI-Based Support System for GBV Survivors in Nigeria
### Built with Retrieval-Augmented Generation (RAG)

---

## What This System Does

This chatbot answers questions about gender-based violence (GBV) support in Nigeria
by retrieving information directly from official documents — Nigerian laws, clinical
guidelines, and survivor support directories — rather than generating unsupported answers.

**Technologies used:**
- **LangChain** — RAG orchestration
- **ChromaDB** — local vector database
- **Sentence Transformers** — free local embeddings (no API key needed)
- **OpenAI GPT-4o-mini** (or Claude Haiku) — language model
- **Streamlit** — chat interface

---

## Project Structure

```
gbv_support_system/
│
├── data/                          ← Put your PDFs here
│   ├── Violence-Against-Persons-Prohibition-Act-2015-1.pdf
│   ├── Clinical-management-of-rape-and-intimate-partner-violence-survivors.pdf
│   ├── clinical-mgtrape-2005rev1.pdf
│   ├── Directory-of-SARCs-Oct-2024.pdf
│   ├── Survivor support services in Nigeria.pdf
│   └── VAPP_2021_Report__.pdf
│
├── vectorstore/                   ← Created automatically by ingest.py
│
├── src/
│   ├── ingest.py                  ← Step 1: Load PDFs → Chroma DB
│   ├── rag_pipeline.py            ← Step 2: Retriever + LLM chain
│   └── app.py                     ← Step 3: Streamlit chat UI
│
├── .env.example                   ← Copy to .env and add your API key
├── requirements.txt
└── README.md
```

---

## Setup Instructions (Day 1–2)

### Step 0: Python environment

```bash
# Make sure you have Python 3.12
python --version

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 1: Add your API key

```bash
cp .env.example .env
```

Open `.env` and add your OpenAI key:
```
OPENAI_API_KEY=sk-...
```

> **Want to use Claude instead?**
> Add `ANTHROPIC_API_KEY=sk-ant-...` and `USE_ANTHROPIC=true` to `.env`
> Then run: `pip install langchain-anthropic`

### Step 2: Add your PDFs

Copy all 6 PDF files into the `data/` folder.

### Step 3: Run the ingestion script

```bash
python src/ingest.py
```

This will:
1. Load all PDFs from `data/`
2. Split them into ~1000-character chunks
3. Generate embeddings using a free local model
4. Store everything in `vectorstore/`

**First run takes 2–5 minutes** (downloads the embedding model ~90 MB).
Subsequent runs are fast.

### Step 4: Start the chatbot

```bash
streamlit run src/app.py
```

Open your browser at **http://localhost:8501**

---

## Demo Questions for Your Presentation

Test these during your live demo:

1. "What is the VAPP Act?"
2. "What should a rape survivor do immediately?"
3. "Where can survivors get help in Nigeria?"
4. "What services do SARCs provide?"
5. "What are the legal rights of GBV survivors?"
6. "How can I report gender-based violence?"

---

## RAG Pipeline Explained

```
User asks a question
        │
        ▼
  Chat Interface (Streamlit)
        │
        ▼
  Retriever searches ChromaDB
  for the 4 most relevant chunks
        │
        ▼
  ChromaDB Vector Store
  (built from your PDFs)
        │
        ▲
  Sentence Transformer Embeddings
  convert text → vectors
        │
        ▲
  PDF Documents (data/ folder)
        │
        ▼
  Retrieved chunks + question
  sent to LLM (GPT-4o-mini)
        │
        ▼
  Grounded answer with source citations
```

**Key insight:** The LLM only answers based on retrieved chunks from your
official documents. If something isn't in the documents, it says so —
this prevents hallucination.

---

## Presentation Talking Points

> "The chatbot retrieves answers from official Nigerian laws, clinical guidelines,
> and survivor support documents rather than generating unsupported responses."

> "Using RAG means every answer is grounded in real documents. I can show you
> exactly which page of which document the answer came from."

> "The embedding model converts text into mathematical vectors. When a user asks
> a question, we find the most similar document chunks and give those to the LLM
> as context."

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `No PDF files found` | Make sure PDFs are in the `data/` folder |
| `Vector store not found` | Run `python src/ingest.py` first |
| `OpenAI API error` | Check your `.env` file has a valid `OPENAI_API_KEY` |
| Slow first run | Normal — downloading the embedding model (~90 MB) |
| Import errors | Make sure virtual environment is activated |
