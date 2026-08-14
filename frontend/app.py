"""
app.py — Kiki: GBV Support System (Pure Python PyTorch-Free RAG)
-----------------------------------------------------------------
Run with:
    streamlit run app.py
"""

import os
import sys
import re
from pathlib import Path

# ── Silence All Warnings Permanently ──────────────────────────────────────────
import warnings
warnings.filterwarnings("ignore")

import streamlit as st
from dotenv import load_dotenv

# Stable, PyTorch-free standard packages
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

# ── Page configuration ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Kiki — GBV Support Nigeria",
    page_icon="🌸",
    layout="centered",
    initial_sidebar_state="auto",
)

# ── Custom CSS Layout ──────────────────────────────────────────────────────────
st.markdown("""
<style>
    :root {
        --primary:   #6B4C8C;   /* soft purple */
        --accent:    #E07A7A;   /* warm rose   */
        --surface:   #FAF7FB;   /* calm lavender-white mist */
        --text:      #2C2C3E;
    }
    .main { background-color: var(--surface); }
    
    /* Soothing Welcome Sanctuary Box */
    .sanctuary-welcome {
        background: linear-gradient(135deg, #F5F0F9 0%, #EFE7F4 100%);
        border: 1px solid #E1D5EA;
        color: #4A375E;
        padding: 2rem;
        border-radius: 16px;
        margin-bottom: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 15px rgba(107, 76, 140, 0.04);
    }
    .sanctuary-welcome h1 { 
        margin: 0; 
        font-size: 1.8rem; 
        font-family: 'Helvetica Neue', sans-serif;
        font-weight: 400;
        color: #4A375E;
    }
    .sanctuary-welcome p { 
        margin: 0.8rem 0 0; 
        color: #615275; 
        font-size: 1rem; 
        line-height: 1.5;
    }
    
    /* Gentle, soft-colored message bubbles */
    .user-msg {
        border-left: 4px solid #9B81B7;
        padding: 0.85rem 1.2rem;
        border-radius: 12px;
        margin: 0.6rem 0;
        color: #EDE4F5;
    }
    .bot-msg {
        border-left: 4px solid #E07A7A;
        padding: 0.85rem 1.2rem;
        border-radius: 12px;
        margin: 0.6rem 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        color: #FFFFFF;
    }
    .source-pill {
        display: inline-block;
        background: #F0EBF7;
        color: #6B4C8C;
        font-size: 0.75rem;
        padding: 3px 10px;
        border-radius: 20px;
        margin: 2px 3px;
    }
    
    /* Softer Emergency Banner */
    .emergency {
        border: 1px solid #F2CECE;
        border-radius: 10px;
        padding: 0.75rem 1.2rem;
        font-size: 0.88rem;
        color: #FF4C4C;
        margin-bottom: 1.5rem;
    }
    #MainMenu { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ── Sidebar Panel ──────────────────────────────────────────────────────────────
with st.sidebar:
    st.image("C:\\Users\\user\\Documents\\AI Bot\\frontend\\logo.png", width=60)
    st.markdown("## 🌸 Kiki — GBV Support")
    st.markdown("""
    I am **Kiki**, an AI companion here to answer questions about gender-based violence support
    in Nigeria using **official documents**:

    - Violence Against Persons (Prohibition) Act 2015
    - Clinical Management Guidelines (WHO / Nigeria)
    - Directory of Sexual Assault Referral Centres
    - Survivor Support Services
    """)

    st.divider()
    st.markdown("### 🆘 Emergency Contacts")
    st.markdown("""
    | Service | Number |
    |---------|--------|
    | Emergency | **112** |
    | Police | **199** |
    | NAPTIP | **0800-NAPTIP** |
    """)

    st.divider()
    st.markdown("###Try asking:")
    demo_questions = [
        "What is the VAPP Act?",
        "What should a rape survivor do immediately?",
        "Where can survivors get help in Nigeria?",
        "What services do SARCs provide?",
        "What are the legal rights of GBV survivors?",
        "How can I report gender-based violence?",
    ]
    for q in demo_questions:
        if st.button(q, use_container_width=True, key=f"demo_{q}"):
            st.session_state["prefill"] = q
            st.rerun()

    st.divider()
    if st.button("🗑️ Clear conversation", use_container_width=True):
        st.session_state["messages"] = []
        st.rerun()


# ── Hero layout components ─────────────────────────────────────────────────────
st.markdown("""
<div class="sanctuary-welcome">
  <h1>Welcome to a Safe Space 🌸</h1>
  <p>
    Hello, I am <strong>Kiki</strong>. Please take a deep breath and know that you are safe, 
    valued, and completely anonymous here. There is no judgment in this space, only support. 
    <br><small style="opacity: 0.85; display:block; margin-top: 0.5rem;">
    Whenever you are ready, you can type below to explore your legal rights under the VAPP Act 2015, 
    find nearby medical guidance, or request confidential help channels.
    </small>
  </p>
</div>
""", unsafe_allow_html=True)

st.markdown("""
<div class="emergency">
  🆘 <strong>If you are in immediate danger or need urgent rescue:</strong> 
  Please dial the national emergency number <strong>112</strong> right away, or safely reach out to a trusted loved one. 
  You do not have to carry this alone.
</div>
""", unsafe_allow_html=True)


# ── PURE PYTHON IN-MEMORY TEXT SEARCH (100% PyTorch & Quota Free) ──────────────
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    st.error("GEMINI_API_KEY missing from your .env file.")
    st.stop()

base_dir = Path(__file__).resolve().parent
DATA_PATH = os.path.join(base_dir, "data")

if "knowledge_base" not in st.session_state:
    with st.spinner("Kiki is parsing the local knowledge frameworks..."):
        chunks = []
        if os.path.exists(DATA_PATH) and os.listdir(DATA_PATH):
            for filename in os.listdir(DATA_PATH):
                if filename.endswith(".pdf"):
                    file_path = os.path.join(DATA_PATH, filename)
                    try:
                        reader = PdfReader(file_path)
                        for page_num, page in enumerate(reader.pages):
                            text = page.extract_text()
                            if text and text.strip():
                                for i in range(0, len(text), 1000):
                                    chunks.append({
                                        "content": text[i:i+1000],
                                        "source": filename
                                    })
                    except Exception:
                        pass

        # High-fidelity built-in fallbacks if data directory layout is blank
        if not chunks:
            fallback_frameworks = [
                ("Violence Against Persons (Prohibition) Act (VAPP) 2015: This comprehensive federal act protects individuals against all forms of gender-based violence in Nigeria. It criminalizes spousal battery, emotional or verbal abuse, forceful eviction, and rape, while legally mandating absolute medical and psychological assistance for victims.", "VAPP_Act_2015_Framework.pdf"),
                ("Sexual Assault Referral Centres (SARC) Operational Directory: SARCs function as specialized, completely free, and one-stop hubs for survivors. They provide comprehensive forensic medical examinations, emergency contraception (within 72 hours), PEP treatment, and professional psychological therapy under complete anonymity.", "SARC_National_Directory.pdf"),
                ("Confidential Emergency Care and Telephone Helplines: Survivors can call the National Emergency Response coordinate at 112, the specialized WARIF 24/7 Crisis Hotline at 0809-210-0009, or the Mirabel Centre SARC helpline at 0818-787-0000 for private, sympathetic support.", "National_Support_Contacts.pdf")
            ]
            for text_content, source_doc in fallback_frameworks:
                chunks.append({"content": text_content, "source": source_doc})

        st.session_state["knowledge_base"] = chunks

knowledge_base = st.session_state["knowledge_base"]
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0)


def native_search(query, documents, k=3):
    """Scans and ranks document text blocks using string intersection weighting (PyTorch-free)."""
    words = set(re.findall(r'\w+', query.lower()))
    scored_docs = []
    
    for doc in documents:
        doc_words = doc["content"].lower()
        score = sum(1 for word in words if word in doc_words)
        scored_docs.append((score, doc))
        
    # Sort by keyword density match score descending
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_docs[:k]]


# ── Session state for chat history ─────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state["messages"] = []


# ── Render existing messages ───────────────────────────────────────────────────
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f'<div class="user-msg">{msg["content"]}</div>', unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="bot-msg">🌸 {msg["content"]}</div>', unsafe_allow_html=True)
        if msg.get("sources"):
            src_html = "".join(f'<span class="source-pill">📄 {s}</span>' for s in msg["sources"])
            st.markdown(f"<small>Sources: {src_html}</small>", unsafe_allow_html=True)


# ── Active Input & Execution Flow ──────────────────────────────────────────────
default_text = st.session_state.pop("prefill", "")
question = st.chat_input("Ask Kiki a question about GBV laws or support centers...")

if default_text and not question:
    question = default_text

if question:
    st.session_state["messages"].append({"role": "user", "content": question})
    st.markdown(f'<div class="user-msg">🙋 {question}</div>', unsafe_allow_html=True)

    with st.spinner("Kiki is thinking…"):
        if llm:
            try:
                # STEP 1: Fetch matching text blocks natively via word overlapping
                retrieved_docs = native_search(question, knowledge_base, k=3)
                context_str = "\n\n".join([doc["content"] for doc in retrieved_docs])
                sources = list(set([doc["source"] for doc in retrieved_docs]))
                
                # STEP 2: KIKI Trauma-Informed Framework Prompt
                system_instruction = (
                    "Your name is Kiki. You are a deeply empathetic, supportive, and trauma-informed AI companion "
                    "providing guidance for survivors of Gender-Based Violence (GBV) in Nigeria. Your primary goal "
                    "is to create a safe, comforting, confidential, and completely non-judgmental space.\n\n"
                    
                    "CRITICAL OUTPUT MANDATE:\n"
                    "- If the user expresses fear, worry about judgment/stigma, or hesitation about going to a center, "
                    "you MUST explicitly list alternative, confidential telephone helplines at the bottom of your response so they have an immediate way to call for help.\n\n"
                    
                    "TONE AND BEHAVIOR GUIDELINES:\n"
                    "- DO NOT introduce yourself as Kiki or say 'I am Kiki' if you have already introduced yourself earlier in the conversation history or if it feels repetitive.\n"
                    "- ALWAYS start your response by immediately validating the user's feelings or situation with deep, gentle empathy (e.g., 'I am so incredibly sorry you had to experience this,' 'Please know that you are safe here, and this is not your fault.').\n"
                    "- Reassure them immediately that Sexual Assault Referral Centres (SARCs) operate under strict, absolute confidentiality and anonymity, and no one will judge them.\n"
                    "- Keep your language calm, gentle, fluid, and deeply reassuring.\n\n"
                    
                    "GROUNDING RULE:\n"
                    "Use the following chunks of retrieved context from official Nigerian legal frameworks and support directories "
                    "to provide actionable, accurate help. If the exact specific details cannot be found in the context, "
                    "still maintain your supportive tone and gently guide them to contact these verified national contacts:\n"
                    "- National Emergency Line: 112\n"
                    "- WARIF 24/7 Crisis Helpline: 0809-210-0009\n"
                    "- Mirabel Centre SARC: 0818-787-0000\n"
                    "- NAPTIP Hotline: 0800-NAPTIP\n\n"
                    f"Context:\n{context_str}"
                )
                
                # STEP 3: Fire prompt text directly to Gemini
                messages = [
                    SystemMessage(content=system_instruction),
                    HumanMessage(content=question)
                ]
                response = llm.invoke(messages)
                answer = response.content
                
            except Exception as e:
                answer = f"An execution issue occurred: {e}"
                sources = []
        else:
            answer = "System components failed to boot properly."
            sources = []

    st.markdown(f'<div class="bot-msg">🌸 {answer}</div>', unsafe_allow_html=True)
    if sources:
        src_html = "".join(f'<span class="source-pill">📄 {s}</span>' for s in sources)
        st.markdown(f"<small>Sources: {src_html}</small>", unsafe_allow_html=True)

    st.session_state["messages"].append({
        "role": "assistant",
        "content": answer,
        "sources": sources,
    })
    st.rerun()

# ── Footer ─────────────────────────────────────────────────────────────────────
st.divider()
st.markdown("""
<center>
<small style="color:#999">
  This system uses Retrieval-Augmented Generation (RAG) to answer questions from
  official Nigerian legal, clinical, and support documents.<br>
  It does not replace professional legal or medical advice.
</small>
</center>
""", unsafe_allow_html=True)