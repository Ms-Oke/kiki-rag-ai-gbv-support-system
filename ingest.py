import os
from pypdf import PdfReader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

def main():
    DATA_PATH = "data"
    FAISS_PATH = "faiss_db"
    
    # Verify the Gemini Key exists
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: Valid GEMINI_API_KEY not found in your .env file.")
        return

    print("Loading PDF documents natively from data/ directory...")
    if not os.path.exists(DATA_PATH) or not os.listdir(DATA_PATH):
        print(f"Error: Please ensure your PDFs are placed in the '{DATA_PATH}' folder.")
        return

    documents_list = []
    for filename in os.listdir(DATA_PATH):
        if filename.endswith(".pdf"):
            file_path = os.path.join(DATA_PATH, filename)
            try:
                reader = PdfReader(file_path)
                for page_num, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text and text.strip():
                        # Structural 1000-character chunking
                        for i in range(0, len(text), 1000):
                            chunk_text = text[i:i+1000]
                            doc = Document(
                                page_content=chunk_text,
                                metadata={"source": filename, "page": page_num + 1}
                            )
                            documents_list.append(doc)
            except Exception as e:
                print(f"Warning: Could not read {filename}. Error: {e}")

    print(f"Loaded and split documents into {len(documents_list)} chunks.")

    # Generate Embeddings using Google's current free developer model
    print("Generating Google Embeddings and creating FAISS Vector Index...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2",  # <-- Changed from text-embedding-004
        google_api_key=api_key
    )
    
    db = FAISS.from_documents(documents_list, embeddings)
    db.save_local(FAISS_PATH)
    
    print(f"Success! Your vector database is completely built and saved in './{FAISS_PATH}'!")

if __name__ == "__main__":
    main()