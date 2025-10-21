#!/usr/bin/env python3
"""
Pushes locally curated account intelligence into the configured OpenAI vector stores.

Usage examples:
    python scripts/sync_vector_stores.py          # sync all accounts
    python scripts/sync_vector_stores.py --clients ag-barr saint-gobain
    python scripts/sync_vector_stores.py --dry-run

The script expects the following environment variables (see .env):
    OPENAI_API_KEY
    AGB_VS
    SG_VS
    TMC_VS
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Tuple

try:
    from openai import OpenAI
except ImportError as exc:  # pragma: no cover - guidance for missing dependency
    raise SystemExit(
        "The `openai` package is required. Install it with `pip install openai`."
    ) from exc

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = REPO_ROOT / "data"
ENV_PATH = REPO_ROOT / ".env"


@dataclass(frozen=True)
class AccountConfig:
    slug: str
    env_var: str
    label: str
    data_directory: Path


ACCOUNTS: Dict[str, AccountConfig] = {
    "ag-barr": AccountConfig(
        slug="ag-barr",
        env_var="AGB_VS",
        label="AG Barr",
        data_directory=DATA_ROOT / "AG Barr" / "json",
    ),
    "saint-gobain": AccountConfig(
        slug="saint-gobain",
        env_var="SG_VS",
        label="Saint-Gobain",
        data_directory=DATA_ROOT / "St Gobain" / "json",
    ),
    "msd": AccountConfig(
        slug="msd",
        env_var="TMC_VS",
        label="MSD",
        data_directory=DATA_ROOT / "TMC" / "json",
    ),
}


def load_env_file(path: Path) -> None:
    """
    Minimal .env loader to support `python scripts/sync_vector_stores.py` without additional deps.
    """
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def discover_documents(data_dir: Path) -> Iterator[Tuple[str, str]]:
    """
    Yield (document_id, prepared_text) tuples for every JSON artifact in `data_dir`.
    """
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    for json_path in sorted(data_dir.glob("*.json")):
        with json_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)

        document_id = json_path.stem.replace(" ", "_")
        document_text = render_document_summary(json_path.name, payload)
        yield document_id, document_text


def render_document_summary(filename: str, payload: dict) -> str:
    """
    Produce a text block that captures the salient content of a converted JSON artifact.
    """
    doc_type = payload.get("type", "unknown")
    header = f"# Source: {filename}\nType: {doc_type}\n"

    if doc_type == "docx":
        paragraphs = payload.get("paragraphs") or []
        body = "\n".join(paragraphs)
    elif doc_type == "pptx":
        slides = payload.get("slides") or []
        slide_blocks = []
        for slide in slides:
            number = slide.get("slide_number")
            lines = slide.get("text") or []
            title = f"Slide {number}" if number is not None else "Slide"
            slide_blocks.append(f"{title}\n" + "\n".join(lines))
        body = "\n\n".join(slide_blocks)
    else:
        body = json.dumps(payload, indent=2)

    return header + body


def upload_documents(
    client: OpenAI,
    vector_store_id: str,
    documents: Iterable[Tuple[str, str]],
    dry_run: bool = False,
) -> None:
    """
    Upload each rendered document into the target vector store via the Assistants API.
    """
    for document_id, text_blob in documents:
        if dry_run:
            print(f"[dry-run] Would upload {document_id} ({len(text_blob)} chars) to {vector_store_id}")
            continue

        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", suffix=".txt", delete=False
        ) as tmp_file:
            tmp_file.write(text_blob)
            tmp_path = tmp_file.name

        try:
            with open(tmp_path, "rb") as handle:
                client.vector_stores.files.upload_and_poll(
                    vector_store_id=vector_store_id,
                    file=handle,
                )
            print(f"Uploaded {document_id} to vector store {vector_store_id}")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync Golden Ticket datasets into OpenAI vector stores.")
    parser.add_argument(
        "--clients",
        nargs="+",
        metavar="slug",
        help=f"Subset of clients to sync. Available: {', '.join(sorted(ACCOUNTS.keys()))}",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without calling the OpenAI API.",
    )
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    load_env_file(ENV_PATH)
    args = parse_args(argv)

    try:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    except KeyError as exc:
        raise SystemExit("OPENAI_API_KEY must be set in environment or .env file.") from exc

    selected_slugs = args.clients or sorted(ACCOUNTS.keys())

    for slug in selected_slugs:
        config = ACCOUNTS.get(slug)
        if not config:
            print(f"Unknown client slug '{slug}'. Skipping.", file=sys.stderr)
            continue

        vector_store_id = os.environ.get(config.env_var)
        if not vector_store_id:
            print(f"Environment variable {config.env_var} is not set. Skipping {config.label}.", file=sys.stderr)
            continue

        try:
            documents = list(discover_documents(config.data_directory))
        except FileNotFoundError as err:
            print(f"{err}. Skipping {config.label}.", file=sys.stderr)
            continue

        if not documents:
            print(f"No JSON documents found for {config.label} in {config.data_directory}.", file=sys.stderr)
            continue

        print(f"Syncing {len(documents)} documents for {config.label} -> {vector_store_id}")
        upload_documents(client, vector_store_id, documents, dry_run=args.dry_run)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
