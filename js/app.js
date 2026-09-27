/*
  WordReader MVP
  - Static frontend demo
  - Data stored in localStorage
  - PDF/DOCX/image/TXT support is intentionally modular
  - Replace mockAnalyzeWord() and mockTranslate() with backend APIs for production AI/OCR.
*/

const state = {
  documents: JSON.parse(localStorage.getItem("wr_documents") || "[]"),
  savedWords: JSON.parse(localStorage.getItem("wr_savedWords") || "[]"),
  cards: JSON.parse(localStorage.getItem("wr_cards") || "[]"),
  currentDocumentId: null,
  currentWord: null,
  currentSentence: null,
  currentParagraph: null,
  fontSize: 18,
  flashIndex: 0,
  flashRevealed: false
};

const $ = (s) => document.querySelector(s);

function saveState() {
  localStorage.setItem("wr_documents", JSON.stringify(state.documents));
  localStorage.setItem("wr_savedWords", JSON.stringify(state.savedWords));
  localStorage.setItem("wr_cards", JSON.stringify(state.cards));
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function tokenize(text) {
  return text.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    const clean = part.replace(/^[^\p{L}\p{N}'’-]+|[^\p{L}\p{N}'’-]+$/gu, "");
    if (!clean) return escapeHtml(part);
    const leading = part.slice(0, part.indexOf(clean));
    const trailing = part.slice(part.indexOf(clean) + clean.length);
    return `
    ${escapeHtml(leading)}
    <span class="word" data-word="${escapeHtml(clean)}">
    ${escapeHtml(clean)}
    </span>
    ${escapeHtml(trailing)}`;
  }).join("");
}

function sentenceToHtml(sentence) {
  return `${tokenize(sentence)} 
    <button class="translate-btn" title="Dịch câu" data-translate="
    ${encodeURIComponent(sentence)}">✨
    </button>`;
}

function renderParagraph(text) {
  const sentences =
    text.match(
      /[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g
    ) || [text];

  const paragraphText = text.trim();

  return `
    <div class="reader-paragraph">

      <div class="paragraph-content">
        ${sentences.map(sentenceToHtml).join(" ")}
      </div>

      <div class="paragraph-actions">
        <button
          class="translate-paragraph-btn"
          type="button"
          title="Dịch đoạn văn"
          data-paragraph="${encodeURIComponent(paragraphText)}"
        >
          🌐
        </button>
      </div>

      <div class="paragraph-translation hidden"></div>

    </div>
  `;
}

function renderReader(doc) {
  $("#emptyReader").classList.add("hidden");
  $("#readerContainer").classList.remove("hidden");
  $("#documentTitle").textContent = doc.name;
  $("#documentMeta").textContent = `${doc.type.toUpperCase()} · ${doc.text.length.toLocaleString()} ký tự`;
  $("#readerContainer").innerHTML = `
    <div class="document-page" style="font-size:${state.fontSize}px">
      ${doc.text.split(/\n\s*\n/).filter(Boolean).map(renderParagraph).join("")}
    </div>
  `;
  bindReaderEvents();
}

function bindReaderEvents() {

  // ==========================================
  // CLICK VÀO TỪ
  // ==========================================

  document.querySelectorAll(".word").forEach(el => {

    el.addEventListener("click", e => {

      e.stopPropagation();

      const word = el.dataset.word;

      const paragraph =
        el.closest(".reader-paragraph");

      const sentence =
        findSentenceContaining(
          paragraph?.innerText || "",
          word
        );

      state.currentWord = word;
      state.currentSentence = sentence;

      openWordPopup(
        el,
        word,
        sentence
      );

    });

  });


  // ==========================================
  // CLICK DỊCH TỪNG CÂU
  // ==========================================

  document
    .querySelectorAll(".translate-btn")
    .forEach(btn => {

      btn.addEventListener("click", e => {

        e.stopPropagation();

        const sentence =
          decodeURIComponent(
            btn.dataset.translate
          );

        openTranslation(
          sentence,
          "Dịch câu"
        );

      });

    });


  // ==========================================
  // CLICK DỊCH CẢ ĐOẠN
  // ==========================================

  document
    .querySelectorAll(".translate-paragraph-btn")
    .forEach(btn => {

      btn.addEventListener("click", e => {

        e.stopPropagation();

        const paragraph =
          decodeURIComponent(
            btn.dataset.paragraph
          );

        // Lưu đoạn văn hiện tại
        state.currentParagraph = paragraph;

        // Gửi toàn bộ đoạn văn đến chức năng dịch
        openTranslation(
          paragraph,
          "Dịch đoạn văn"
        );

      });

    });

}


function findSentenceContaining(text, word) {
  const sentences = text.replace(/✨/g, "").match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) || [text];
  return sentences.find(s => s.toLowerCase().includes(word.toLowerCase()))?.trim() || text.trim();
}

/* ---------- Mock language engine ----------
   This gives the MVP a working experience.
   Production version should call your FastAPI/AI endpoint.
*/
const dictionary = {
  language: {
    ipa: "/ˈlæŋɡwɪdʒ/",
    context: "ngôn ngữ",
    meanings: ["ngôn ngữ", "cách diễn đạt", "ngôn ngữ lập trình"],
    example: "English is an international language."
  },
  learn: {
    ipa: "/lɜːrn/",
    context: "học, học cách làm điều gì",
    meanings: ["học", "học cách", "ghi nhớ"],
    example: "I want to learn English."
  },
  beautiful: {
    ipa: "/ˈbjuːtɪfəl/",
    context: "đẹp, xinh đẹp",
    meanings: ["đẹp", "xinh đẹp", "tuyệt đẹp"],
    example: "She has a beautiful voice."
  },
  time: {
    ipa: "/taɪm/",
    context: "thời gian",
    meanings: ["thời gian", "lần", "khoảng thời gian"],
    example: "I don't have much time."
  },
  practice: {
    ipa: "/ˈpræktɪs/",
    context: "sự luyện tập / luyện tập",
    meanings: ["luyện tập", "thực hành", "thực tiễn"],
    example: "Practice makes progress."
  },
  book: {
    ipa: "/bʊk/",
    context: "quyển sách",
    meanings: ["sách", "đặt trước", "đặt chỗ"],
    example: "I read a book every week."
  }
};

function mockAnalyzeWord(word, sentence) {
  const key = word.toLowerCase().replace(/[.,!?;:]/g, "");
  if (dictionary[key]) return dictionary[key];

  return {
    ipa: `/${key}/`,
    context: `nghĩa của "${key}" trong ngữ cảnh này`,
    meanings: [`${key} (nghĩa thường dùng)`, "cần AI phân tích thêm ngữ cảnh"],
    example: sentence
  };
}

function mockTranslate(text) {
  // Demo translation only. Replace with real AI API.
  const known = {
    "Learning a new language takes time.": "Học một ngôn ngữ mới cần có thời gian.",
    "The best way to learn is through practice.": "Cách tốt nhất để học là thông qua việc luyện tập.",
    "Reading regularly can improve your vocabulary.": "Đọc thường xuyên có thể cải thiện vốn từ vựng của bạn."
  };
  if (known[text.trim()]) return known[text.trim()];
  return `[Bản dịch AI sẽ được trả về ở đây] ${text}`;
}

/* ---------- Popup ---------- */
function openWordPopup(target, word, sentence) {
  const data = mockAnalyzeWord(word, sentence);
  $("#popupWord").textContent = word;
  $("#popupPronunciation").textContent = data.ipa;
  $("#contextMeaning").textContent = data.context;
  $("#commonMeanings").innerHTML = data.meanings.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  $("#popupExample").textContent = data.example;

  const popup = $("#wordPopup");
  popup.classList.remove("hidden");

  const rect = target.getBoundingClientRect();
  const width = 355;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  if (top + 430 > window.innerHeight) top = Math.max(12, rect.top - 430);
  popup.style.left = `${Math.max(12, left)}px`;
  popup.style.top = `${Math.max(12, top)}px`;

  $("#saveWordBtn").textContent = isSaved(word) ? "✓ Đã lưu vào thư viện" : "＋ Lưu vào thư viện";
}

function isSaved(word) {
  return state.savedWords.some(x =>
    x.word.toLowerCase() === word.toLowerCase() &&
    x.documentId === state.currentDocumentId
  );
}

$("#closePopup").addEventListener("click", () => $("#wordPopup").classList.add("hidden"));

$("#speakBtn").addEventListener("click", () => {
  if (!state.currentWord || !("speechSynthesis" in window)) {
    toast("Trình duyệt không hỗ trợ phát âm.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(state.currentWord);
  utterance.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
});

$("#saveWordBtn").addEventListener("click", () => {
  if (!state.currentWord || !state.currentDocumentId) return;

  if (isSaved(state.currentWord)) {
    toast("Từ này đã có trong thư viện.");
    return;
  }

  const data = mockAnalyzeWord(state.currentWord, state.currentSentence || "");
  const item = {
    id: crypto.randomUUID(),
    word: state.currentWord,
    documentId: state.currentDocumentId,
    sentence: state.currentSentence || "",
    ipa: data.ipa,
    contextMeaning: data.context,
    commonMeanings: data.meanings,
    example: data.example,
    createdAt: Date.now()
  };

  state.savedWords.push(item);
  state.cards.push({
    id: crypto.randomUUID(),
    wordId: item.id,
    interval: 0,
    repetitions: 0,
    ease: 2.5,
    nextReview: Date.now(),
    lapses: 0
  });

  saveState();
  $("#saveWordBtn").textContent = "✓ Đã lưu vào thư viện";
  toast(`Đã lưu "${state.currentWord}"`);
});

/* ---------- Translation ---------- */
function openTranslation(text, title) {
  $("#translationTitle").textContent = title;
  $("#translationOriginal").textContent = text;
  $("#translationResult").textContent = "AI đang dịch...";
  $("#translationModal").classList.remove("hidden");

  setTimeout(() => {
    $("#translationResult").textContent = mockTranslate(text);
  }, 350);
}

function closeTranslation() {
  $("#translationModal").classList.add("hidden");
}
$("#closeTranslation").addEventListener("click", closeTranslation);
$("#closeTranslation2").addEventListener("click", closeTranslation);

/* ---------- Navigation ---------- */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

function switchView(view) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(`#${view}View`).classList.add("active");

  if (view === "library") renderLibrary();
  if (view === "flashcards") renderFlashcards();
}

function renderDocuments() {
  const list = $("#documentList");
  if (!state.documents.length) {
    list.innerHTML = `<div class="muted" style="padding:9px">Chưa có tài liệu.</div>`;
    return;
  }

  list.innerHTML = state.documents.map(doc => `
    <button class="document-item ${doc.id === state.currentDocumentId ? "active" : ""}" data-id="${doc.id}">
      <span>📄</span>
      <span class="document-name">${escapeHtml(doc.name)}</span>
    </button>
  `).join("");

  list.querySelectorAll(".document-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const doc = state.documents.find(x => x.id === btn.dataset.id);
      state.currentDocumentId = doc.id;
      renderDocuments();
      renderReader(doc);
    });
  });
}

/* ---------- File handling ---------- */
function openFilePicker() {
  $("#fileInput").click();
}
$("#uploadTopBtn").addEventListener("click", openFilePicker);
$("#uploadSideBtn").addEventListener("click", openFilePicker);
$("#uploadEmptyBtn").addEventListener("click", openFilePicker);

$("#fileInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const doc = await parseFile(file);
    state.documents.push(doc);
    state.currentDocumentId = doc.id;
    saveState();
    renderDocuments();
    renderReader(doc);
    toast(`Đã mở ${file.name}`);
  } catch (err) {
    console.error(err);
    toast("Không đọc được file. Hãy thử TXT hoặc PDF text.");
  }

  e.target.value = "";
});

async function parseFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (["txt", "md"].includes(ext)) {
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: ext,
      text: await file.text()
    };
  }

  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    // OCR production hook:
    // POST file to /api/ocr and return text + coordinates.
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: "image",
      text: "Ảnh đã được tải lên.\n\nOCR thật sẽ được xử lý bởi backend ở phiên bản tiếp theo.\n\nBạn có thể nối Tesseract.js hoặc API OCR tại đây.",
      imageUrl: URL.createObjectURL(file)
    };
  }

  if (ext === "docx" && window.mammoth) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: "docx",
      text: result.value
    };
  }

  if (ext === "pdf") {
    // Minimal PDF fallback: browser cannot reliably parse all PDFs without a worker.
    // Production hook should use PDF.js to extract text page-by-page and coordinates.
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: "pdf",
      text: "PDF đã được tải lên.\n\nĐể đọc text PDF thật, hãy nối PDF.js worker ở backend/frontend build.\n\nKiến trúc reader đã sẵn sàng để nhận text + tọa độ từng từ."
    };
  }

  if (ext === "pptx") {
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: "pptx",
      text: "PPTX đã được tải lên.\n\nParser PPTX sẽ được nối ở module document-parser của phiên bản backend."
    };
  }

  throw new Error("Unsupported file type");
}

/* ---------- Library ---------- */
function renderLibrary() {
  const container = $("#libraryContainer");
  if (!state.savedWords.length) {
    container.innerHTML = `
      <div class="empty-state" style="margin:30px auto">
        <div class="empty-icon">📚</div>
        <h2>Thư viện đang trống</h2>
        <p>Click vào một từ trong tài liệu rồi chọn "Lưu vào thư viện".</p>
      </div>`;
    return;
  }

  const groups = {};
  state.savedWords.forEach(item => {
    const doc = state.documents.find(d => d.id === item.documentId);
    const name = doc?.name || "Tài liệu không xác định";
    if (!groups[name]) groups[name] = [];
    groups[name].push(item);
  });

  container.innerHTML = Object.entries(groups).map(([name, words]) => `
    <div class="library-group">
      <div class="library-group-header">📄 ${escapeHtml(name)} <span class="muted">(${words.length} từ)</span></div>
      <div class="word-grid">
        ${words.map(item => `
          <div class="word-card-mini">
            <div class="word-name">${escapeHtml(item.word)}</div>
            <div>${escapeHtml(item.ipa)}</div>
            <div class="word-meaning">${escapeHtml(item.contextMeaning)}</div>
            <div class="muted" style="margin-top:8px">${escapeHtml(item.sentence)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

/* ---------- Flashcards ---------- */
function getDueCards() {
  const now = Date.now();
  return state.cards.filter(card => {
    const word = state.savedWords.find(w => w.id === card.wordId);
    return word && card.nextReview <= now;
  });
}

function renderFlashcards() {
  const container = $("#flashcardContainer");
  const due = getDueCards();

  if (!due.length) {
    container.innerHTML = `
      <div class="empty-state" style="margin:30px auto">
        <div class="empty-icon">🎉</div>
        <h2>Không có thẻ cần ôn ngay</h2>
        <p>Hãy lưu thêm từ hoặc quay lại sau.</p>
      </div>`;
    return;
  }

  const card = due[state.flashIndex % due.length];
  const word = state.savedWords.find(w => w.id === card.wordId);
  state.flashRevealed = false;

  container.innerHTML = `
    <div class="flashcard-wrap">
      <div class="flashcard">
        <div class="flash-word">${escapeHtml(word.word)}</div>
        <div class="flash-pron">${escapeHtml(word.ipa)}</div>
        <button id="showAnswer" class="show-answer">Hiện đáp án</button>
        <div id="flashAnswer" class="flash-answer hidden">
          <strong>${escapeHtml(word.contextMeaning)}</strong>
          <div class="flash-example">${escapeHtml(word.sentence)}</div>
        </div>
      </div>
      <div id="flashActions" class="flash-actions hidden">
        <button data-rating="again">Again<br><small>1 phút</small></button>
        <button data-rating="hard">Hard<br><small>6 phút</small></button>
        <button data-rating="good">Good<br><small>1 ngày</small></button>
        <button data-rating="easy">Easy<br><small>4 ngày</small></button>
      </div>
    </div>
  `;

  $("#showAnswer").addEventListener("click", () => {
    $("#flashAnswer").classList.remove("hidden");
    $("#showAnswer").classList.add("hidden");
    $("#flashActions").classList.remove("hidden");
  });

  $("#flashActions").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => reviewCard(card, btn.dataset.rating));
  });
}

function reviewCard(card, rating) {
  const minutes = {
    again: 1,
    hard: 6,
    good: card.repetitions < 1 ? 1440 : Math.max(1440, card.interval * 2 * 1440),
    easy: Math.max(5760, card.interval * 4 * 1440)
  };

  card.interval = Math.round(minutes[rating] / 1440 * 10) / 10;
  card.repetitions = rating === "again" ? 0 : card.repetitions + 1;
  card.nextReview = Date.now() + minutes[rating] * 60000;
  if (rating === "again") card.lapses += 1;
  saveState();
  state.flashIndex += 1;
  renderFlashcards();
  toast(`Đã đánh dấu ${rating}`);
}

/* ---------- Reader controls ---------- */
$("#fontPlus").addEventListener("click", () => {
  state.fontSize = Math.min(30, state.fontSize + 1);
  refreshCurrentReader();
});
$("#fontMinus").addEventListener("click", () => {
  state.fontSize = Math.max(14, state.fontSize - 1);
  refreshCurrentReader();
});
$("#resetReader").addEventListener("click", () => {
  state.fontSize = 18;
  refreshCurrentReader();
});
function refreshCurrentReader() {
  const doc = state.documents.find(d => d.id === state.currentDocumentId);
  if (doc) renderReader(doc);
}

/* ---------- Outside click ---------- */
document.addEventListener("click", e => {
  const popup = $("#wordPopup");
  if (!popup.classList.contains("hidden") &&
      !popup.contains(e.target) &&
      !e.target.classList.contains("word")) {
    popup.classList.add("hidden");
  }
});

/* ---------- Demo document ---------- */
function seedDemo() {
  if (state.documents.length) return;
  const demo = {
    id: "demo-document",
    name: "Demo - English Learning.txt",
    type: "txt",
    text: `Learning a new language takes time.

The best way to learn is through practice. Reading regularly can improve your vocabulary and understanding.

A beautiful morning is a good time to read a book and learn something new.`
  };
  state.documents.push(demo);
  state.currentDocumentId = demo.id;
  saveState();
}

seedDemo();
renderDocuments();
renderReader(state.documents.find(d => d.id === state.currentDocumentId));
