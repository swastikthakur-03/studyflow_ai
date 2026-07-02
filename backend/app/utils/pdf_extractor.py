"""
app/utils/pdf_extractor.py
--------------------------
Extracts text from PDF files using PyMuPDF (fitz).
Returns page-level chunks so we can track page numbers for citations.
"""

import fitz  # PyMuPDF
from typing import List, Dict
import os


def extract_text_from_pdf(file_path: str) -> List[Dict]:
    """
    Extract text from every page of a PDF.

    Returns a list of dicts:
        [{"page": 1, "text": "...content..."}, ...]

    Pages with no extractable text (e.g. scanned images) are skipped.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")

    pages = []
    doc = fitz.open(file_path)

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        if text:  # skip blank / image-only pages
            pages.append({
                "page": page_num + 1,  # 1-based page numbers
                "text": text,
            })

    doc.close()
    return pages


def get_page_count(file_path: str) -> int:
    """Return the total number of pages in a PDF."""
    doc = fitz.open(file_path)
    count = len(doc)
    doc.close()
    return count


def chunk_pages(
    pages: List[Dict],
    chunk_size: int = 500,
    overlap: int = 50,
) -> List[Dict]:
    """
    Split page text into overlapping chunks for embedding.

    Each chunk tracks which page it came from so citations work.
    Returns:
        [{"chunk_index": 0, "page_number": 1, "text": "..."}, ...]
    """
    chunks = []
    chunk_index = 0

    for page_data in pages:
        text = page_data["text"]
        page_num = page_data["page"]
        words = text.split()

        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            if chunk_text.strip():
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "text": chunk_text,
                })
                chunk_index += 1

            # Move forward by (chunk_size - overlap) for sliding window
            start += chunk_size - overlap

    return chunks
