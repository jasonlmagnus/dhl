import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET


WORD_NAMESPACE = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
DRAWING_NAMESPACE = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
PPT_SLIDE_PATH = "ppt/slides"


def extract_docx_text(docx_path: str) -> dict:
    with zipfile.ZipFile(docx_path) as archive:
        try:
            with archive.open("word/document.xml") as doc_xml:
                tree = ET.parse(doc_xml)
        except KeyError as exc:
            raise ValueError(f"{docx_path}: missing document.xml") from exc

    paragraphs = []
    for paragraph in tree.iterfind(".//w:p", {"w": WORD_NAMESPACE[1:-1]}):
        texts = [
            run.text
            for run in paragraph.iterfind(".//w:t", {"w": WORD_NAMESPACE[1:-1]})
            if run.text
        ]
        if texts:
            paragraphs.append("".join(texts))

    return {
        "type": "docx",
        "file": os.path.basename(docx_path),
        "paragraphs": paragraphs,
    }


def extract_pptx_text(pptx_path: str) -> dict:
    slides = []
    with zipfile.ZipFile(pptx_path) as archive:
        slide_names = sorted(
            (name for name in archive.namelist() if name.startswith(f"{PPT_SLIDE_PATH}/slide") and name.endswith(".xml")),
            key=lambda name: int(re.search(r"slide(\d+)\.xml", name).group(1)),
        )

        for slide_name in slide_names:
            with archive.open(slide_name) as slide_xml:
                tree = ET.parse(slide_xml)

            texts = [
                text_elem.text
                for text_elem in tree.iterfind(".//a:t", {"a": DRAWING_NAMESPACE[1:-1]})
                if text_elem.text
            ]
            slide_index = int(re.search(r"slide(\d+)\.xml", slide_name).group(1))
            slides.append(
                {
                    "slide_number": slide_index,
                    "text": texts,
                }
            )

    return {
        "type": "pptx",
        "file": os.path.basename(pptx_path),
        "slides": slides,
    }


def convert_file(path: str) -> dict:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".docx":
        return extract_docx_text(path)
    if ext == ".pptx":
        return extract_pptx_text(path)
    raise ValueError(f"Unsupported file type: {path}")


def write_json(data: dict, output_path: str) -> None:
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)


def convert_directory(root: str) -> None:
    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            if filename.lower().endswith((".docx", ".pptx")):
                file_path = os.path.join(dirpath, filename)
                output_path = os.path.splitext(file_path)[0] + ".json"
                try:
                    print(f"Converting {file_path}")
                    data = convert_file(file_path)
                    write_json(data, output_path)
                except Exception as exc:
                    print(f"Error processing {file_path}: {exc}", file=sys.stderr)


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python convert_to_json.py <directory>", file=sys.stderr)
        sys.exit(1)

    convert_directory(sys.argv[1])


if __name__ == "__main__":
    main()
