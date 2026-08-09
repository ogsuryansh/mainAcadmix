import sys
try:
    import PyPDF2
except ImportError:
    import os
    os.system('pip install PyPDF2')
    import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

if __name__ == "__main__":
    text = extract_text("FT-01B_RM(P2)_01-07-2026_Sol.pdf")
    with open("extracted_answers.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Extracted text saved to extracted_answers.txt")
