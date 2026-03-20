import io
from pypdf import PdfReader


def parse_pdf_bytes(data: bytes) -> tuple[str | None, str | None]:
    """Extract text from PDF bytes. Returns (text, error)."""
    try:
        reader = PdfReader(io.BytesIO(data))
        pages_text: list[str] = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                pages_text.append(extracted)
        text = "\n".join(pages_text)
        if not text.strip():
            return None, (
                "This PDF has no extractable text. It may be a scanned image — "
                "try a PDF with a text layer."
            )
        return text, None
    except Exception as e:
        return None, f"PDF parsing failed: {e}"
