# MindVault AI — Your Personal Knowledge Intelligence Engine

> “Your knowledge, connected. Your thinking, amplified.”

MindVault AI is a local-first knowledge intelligence platform that ingests unstructured documents (PDF, DOCX, Markdown, TXT), extracts concepts, entities, and evidence-backed relationships, builds an interactive knowledge graph, performs hybrid vector retrieval with verifiable citations, uncovers cross-document connections, detects potential contradictions, and finds knowledge gaps.

---

## 🌟 Key Architecture & Capabilities

1. **Local AI Model (Ollama)**: Works seamlessly with local models (`llama3.2:3b`, `qwen2.5-coder:3b`, etc.) without requiring cloud API keys or fees.
2. **Interactive 2D Knowledge Graph**: Powered by React Flow with orbital positioning, color-coded concept categories, edge relation markers, and an interactive metadata drawer.
3. **AI Research Chat**: Semantic grounded Q&A with exact document excerpts and page-level source citations.
4. **Cross-Document Connections**: Detects implicit conceptual bridges connecting distinct documents that do not directly cite each other.
5. **Contradiction Detective**: Surfaces conflicting statements, differing dates, or mutually exclusive assertions across documents.
6. **Knowledge Gap Finder**: Pinpoints unexplained terms, isolated concepts, and suggested inquiry directions.
7. **100% Local Privacy**: Documents, embeddings, graphs, and chats stay on your computer (`./data/`).

---

## 🚀 Quick Start (Windows 11)

### Prerequisites
- **Python 3.12**
- **Node.js 18+ & npm**
- **Ollama** running locally (`ollama run llama3.2:3b`)

### 1. Launch with One Click
Double click or run:
```cmd
start.bat
```

### 2. Manual Commands
**Backend:**
```cmd
backend_venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```cmd
cd frontend
npm run dev
```

Visit the web interface at **`http://localhost:5173`** and the OpenAPI docs at **`http://127.0.0.1:8000/docs`**.

---

## 📂 Project Structure

```
mindvault-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # REST Endpoints (Dashboard, Docs, Chat, Graph, etc.)
│   │   ├── core/         # Settings & paths
│   │   ├── db/           # SQLite async session
│   │   ├── graph/        # LLM & rule-based knowledge graph extractor
│   │   ├── ingestion/    # Text extraction & sliding-window chunker
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── services/     # Ollama service & vector embedding engine
│   └── tests/            # Automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, Navbar, etc.
│   │   ├── pages/        # Overview, My Knowledge, Graph, Chat, etc.
│   │   └── services/     # Axios client & typed API interfaces
│   └── package.json
├── data/
│   ├── uploads/          # Safe document storage
│   ├── indexes/          # Persistent vector embeddings
│   └── mindvault.db      # SQLite relational database
├── start.bat             # Windows one-click runner
└── README.md
```

---

## 🧪 Testing

Run backend tests using:
```cmd
backend_venv\Scripts\pytest backend\tests -v
```
