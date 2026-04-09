const API_BASE = 'http://localhost:8000/api';

// ===== State =====
let currentDocId = null;

// ===== Elements =====
const documentList = document.getElementById('documentList');
const viewerTitle = document.getElementById('viewerTitle');
const viewerText = document.getElementById('viewerText');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Summarize
const btnSummarize = document.getElementById('btnSummarize');
const summaryResult = document.getElementById('summaryResult');

// Quiz
const btnQuiz = document.getElementById('btnQuiz');
const quizResult = document.getElementById('quizResult');
const quizDifficulty = document.getElementById('quizDifficulty');

// Chat
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const btnChat = document.getElementById('btnChat');

// ===== Initialize LMS Data =====
async function fetchDocuments() {
    try {
        const res = await fetch(`${API_BASE}/documents`);
        const data = await res.json();
        renderDocumentList(data.documents);
    } catch (e) {
        documentList.innerHTML = `<div style="padding:15px; color:red">Lỗi tải dữ liệu. Bật Backend chưa?</div>`;
    }
}

function renderDocumentList(docs) {
    documentList.innerHTML = '';
    docs.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'module-item';
        item.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            ${doc.title}
        `;
        
        item.addEventListener('click', () => {
            // Highlight selected
            document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // Load Document
            loadDocument(doc.id, doc.title);
        });
        
        documentList.appendChild(item);
    });
}

async function loadDocument(id, title) {
    currentDocId = id;
    viewerTitle.textContent = title;
    viewerText.innerHTML = "Đang tải bài giảng...";
    
    // Clear old AI results
    summaryResult.innerHTML = '<div class="empty-state"><p>Đã tải bài mới. Nhấn Tóm tắt lại.</p></div>';
    quizResult.innerHTML = '<div class="empty-state"><p>Tạo quiz tự luận dựa trên bài mới.</p></div>';
    chatHistory.innerHTML = `
        <div class="chat-msg ai-msg">
            <div class="msg-bubble">Đã nạp kiến thức bài: ${title}. Cứ hỏi mình nhé!</div>
        </div>
    `;

    try {
        if (id.toLowerCase().endsWith(".pdf")) {
            viewerText.innerHTML = `<iframe src="${API_BASE}/static/${id}" width="100%" height="800px" style="border: none; border-radius: 4px;"></iframe>`;
        } else {
            const res = await fetch(`${API_BASE}/document/${id}`);
            const data = await res.json();
            viewerText.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; font-size: 15px;">${data.content}</pre>`;
        }
    } catch (e) {
        viewerText.innerHTML = "Không thể đọc nội dung trực tiếp, liên hệ Admin.";
    }
}

// Gọi ngay khi web load
fetchDocuments();

// ===== Tab Navigation =====
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// Helper for UI loading
function setButtonLoading(btn, isLoading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');
    if (isLoading) {
        btn.disabled = true;
        text.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// ===== API Calls via Panel =====
btnSummarize.addEventListener('click', async () => {
    if (!currentDocId) return alert("Bạn cần chọn một bài giảng ở menu LMS bên trái trước.");

    setButtonLoading(btnSummarize, true);
    try {
        const response = await fetch(`${API_BASE}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: currentDocId })
        });
        
        const data = await response.json();
        if (response.ok) {
            summaryResult.innerHTML = marked.parse(data.summary);
        } else {
            summaryResult.innerHTML = `<p style="color:red">Lỗi: ${data.detail}</p>`;
        }
    } catch (err) {
        summaryResult.innerHTML = `<p style="color:red">Lỗi kết nối Server.</p>`;
    } finally {
        setButtonLoading(btnSummarize, false);
    }
});

btnQuiz.addEventListener('click', async () => {
    if (!currentDocId) return alert("Bạn cần chọn một bài giảng bên trái trước.");

    setButtonLoading(btnQuiz, true);
    try {
        const response = await fetch(`${API_BASE}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                doc_id: currentDocId,
                difficulty: quizDifficulty.value 
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            quizResult.innerHTML = marked.parse(data.quiz);
        } else {
            quizResult.innerHTML = `<p style="color:red">Lỗi: ${data.detail}</p>`;
        }
    } catch (err) {
        quizResult.innerHTML = `<p style="color:red">Lỗi kết nối Server.</p>`;
    } finally {
        setButtonLoading(btnQuiz, false);
    }
});

function addChatMessage(text, role) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}-msg`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble markdown-body';
    bubble.innerHTML = role === 'ai' ? marked.parse(text) : text;
    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

btnChat.addEventListener('click', async () => {
    if (!currentDocId) return alert("Cần chọn Document từ LMS.");
    const query = chatInput.value.trim();
    if (!query) return;

    addChatMessage(query, 'user');
    chatInput.value = '';
    setButtonLoading(btnChat, true);

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                doc_id: currentDocId,
                query: query
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            addChatMessage(data.answer, 'ai');
        } else {
            addChatMessage(`Lỗi: ${data.detail}`, 'ai');
        }
    } catch (err) {
         addChatMessage(`Lỗi mạng.`, 'ai');
    } finally {
        setButtonLoading(btnChat, false);
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnChat.click();
});
