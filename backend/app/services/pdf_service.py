import os
from pathlib import Path
from typing import Optional

def extract_text_from_pdf(file_path: str) -> str:
    """Extract plain text from PDF using PyMuPDF (fitz) or fallback to pypdf."""
    text_content = []

    # First attempt: PyMuPDF
    try:
        import fitz
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text_content.append(page.get_text())
        doc.close()
        full_text = "\n".join(text_content).strip()
        if full_text:
            return full_text
    except Exception as e:
        print(f"PyMuPDF extraction note: {e}, falling back to pypdf")

    # Second attempt: pypdf fallback
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_content.append(t)
        return "\n".join(text_content).strip()
    except Exception as e:
        print(f"pypdf extraction failed: {e}")
        return ""

