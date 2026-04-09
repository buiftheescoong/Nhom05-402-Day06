import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
import PyPDF2

# Khởi tạo Env
load_dotenv()

# Cấu hình Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "your_gemini_api_key_here":
    print("WARNING: Cần cấu hình GEMINI_API_KEY trong file .env!")
else:
    genai.configure(api_key=api_key)

app = FastAPI(title="LMS Integrated AI Tutor")

# Thư mục chứa tài liệu ảo
DOCS_DIR = os.path.join(os.path.dirname(__file__), 'documents')
if not os.path.exists(DOCS_DIR):
    os.makedirs(DOCS_DIR)

app.mount("/api/static", StaticFiles(directory=DOCS_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    doc_id: str
    query: str = ""
    difficulty: str = ""

# --- Helper functions ---

def get_document_list():
    # Danh mục định sẵn cho Mock LMS
    catalog = {
        "day1_ai_foundation.txt": "Day 1: AI & LLM Foundation",
        "day2_ai_problem.txt": "Day 2: Xác định Bài toán cho AI",
        "day3_react_agent.txt": "Day 3: Design Pattern ReAct (Kiến trúc Agent)"
    }
    
    docs = []
    if os.path.exists(DOCS_DIR):
        for filename in os.listdir(DOCS_DIR):
            if filename.endswith(".txt") or filename.endswith(".pdf"):
                title = catalog.get(filename, filename)
                docs.append({"id": filename, "title": title})
    return docs

def read_document_text(doc_id: str) -> str:
    # Bảo mật đường dẫn (chống Path Traversal)
    safe_id = os.path.basename(doc_id)
    file_path = os.path.join(DOCS_DIR, safe_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu này trong hệ thống!")
        
    try:
        if safe_id.endswith(".pdf"):
            content = ""
            with open(file_path, "rb") as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        content += text + "\n"
            # Giới hạn nội dung nếu quá lớn (cho prototype)
            if len(content) > 60000:
                content = content[:60000] + "\n...(Nội dung đã bị cắt bớt để bảo toàn Token Limit)."
            return content
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc file: {str(e)}")

# --- Endpoints ---

@app.get("/api/documents")
async def list_documents():
    return {"documents": get_document_list()}

@app.get("/api/document/{doc_id}")
async def get_document(doc_id: str):
    content = read_document_text(doc_id)
    return {"content": content}

@app.post("/api/summarize")
async def summarize(body: RequestBody):
    context = read_document_text(body.doc_id)
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
Bạn là AI Tutor Vinschool đang được tích hợp vào hệ thống học tập LMS. Hãy tóm tắt bài giảng mà sinh viên đang xem.
Cấu trúc:
1. **Key Points**: (3-5 gạch đầu dòng nhấn mạnh ý chính)
2. **Tóm tắt chi tiết**: 1 đoạn tường minh.

Luôn cố gắng đính kèm trích dẫn văn bản ở các ý (ví dụ: [Theo nội dung bài giảng...]). Nếu nội dung chưa rõ, báo 💡.

Tài liệu:
{context}
"""
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz")
async def generate_quiz(body: RequestBody):
    context = read_document_text(body.doc_id)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        diff = body.difficulty if body.difficulty else "Cơ bản"
        prompt = f"""
Bạn là AI Tutor Vinschool. Hãy tạo 3 câu hỏi tự luận để kiểm tra mức độ hiểu bài tập mức độ {diff} dựa trên tài liệu sau.
Cấu trúc:
---
**Câu hỏi 1**: [Nội dung câu hỏi]
**💡 Hint**: [Gợi ý]
**✅ Đáp án mẫu**: [Đáp án] (trích dẫn nguồn tài liệu gốc)
---

Tài liệu:
{context}
"""
        response = model.generate_content(prompt)
        return {"quiz": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(body: RequestBody):
    if not body.query:
        raise HTTPException(status_code=400, detail="Thiếu Query.")
        
    context = read_document_text(body.doc_id)
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
Bạn là AI Tutor Vinschool đóng vai trò Chatbot kèm trong hệ thống LMS (Side-panel). Hỏi sinh viên hỏi 1 câu, bạn dùng tài liệu cung cấp để trả lời.
NẾU CÂU HỎI NGOÀI TÀI LIỆU, bạn PHẢI cảnh báo: "📚 Bài giảng này không đề cập vấn đề này, đây là kiến thức chung...". Trả lời rõ ràng, dễ hiểu. Dẫn nguồn.

Tài liệu khóa học đang xem:
{context}

Câu hỏi của sinh viên:
{body.query}
"""
        response = model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
