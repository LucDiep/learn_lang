# WordReader MVP

Đây là bản frontend MVP cho ý tưởng website đọc tài liệu và học từ vựng.

## Chạy

Không cần cài Node.js cho bản demo đơn giản.

Cách nhanh:
1. Giải nén thư mục.
2. Mở `index.html` bằng trình duyệt.
3. Tốt hơn: dùng VS Code + Live Server để chạy.

## Đã có

- Upload TXT / MD.
- Khung kiến trúc cho PDF / DOCX / PPTX / image.
- Click từng từ.
- Popup IPA, nghĩa ngữ cảnh, nghĩa thường dùng, ví dụ.
- Text-to-Speech.
- Lưu từ vào thư viện.
- Tự nhóm thư viện theo tên tài liệu.
- Flashcard.
- Again / Hard / Good / Easy.
- Lưu dữ liệu bằng localStorage.
- Nút dịch ở cuối mỗi câu.
- Nút dịch đoạn có thể bổ sung ở tầng paragraph.
- Responsive cơ bản.

## Quan trọng

Bản HTML/CSS/JS thuần không thể tự cung cấp OCR + AI dịch/tra từ chất lượng production.

Các hàm cần thay bằng API thật:

- `mockAnalyzeWord()` → `POST /api/vocabulary/analyze`
- `mockTranslate()` → `POST /api/translate`
- image OCR → `POST /api/ocr`
- PDF parser → PDF.js hoặc backend document parser
- PPTX parser → parser backend
- DOCX → Mammoth hoặc backend

## Kiến trúc backend đề xuất

Frontend:
- HTML/CSS/JS hoặc React

Backend:
- Python + FastAPI

Database:
- PostgreSQL

Storage:
- S3-compatible object storage

AI:
- một API LLM cho contextual meaning / translation

OCR:
- Tesseract hoặc cloud OCR

## Database production

### users
- id
- email
- password_hash
- created_at

### documents
- id
- user_id
- filename
- file_type
- storage_url
- created_at

### document_pages
- id
- document_id
- page_number
- extracted_text

### document_words
- id
- page_id
- word
- start_offset
- end_offset
- x
- y
- width
- height

### vocabulary
- id
- user_id
- word
- language
- pronunciation

### saved_words
- id
- vocabulary_id
- document_id
- sentence
- context_meaning
- created_at

### flashcards
- id
- saved_word_id
- repetitions
- interval
- ease
- next_review
- lapses
