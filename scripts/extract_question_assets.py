#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import fitz


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MAP_PATH = PROJECT_ROOT / "scripts" / "asset_map.json"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "question-assets"


@dataclass(frozen=True)
class CropRect:
    x0: float
    y0: float
    x1: float
    y1: float

    @classmethod
    def from_json(cls, value: Any) -> "CropRect":
        if isinstance(value, list) and len(value) == 4:
            return cls(*(float(item) for item in value))

        if isinstance(value, dict):
            return cls(
                float(value["x0"]),
                float(value["y0"]),
                float(value["x1"]),
                float(value["y1"]),
            )

        raise ValueError("crop must be [x0, y0, x1, y1] or an object with x0/y0/x1/y1")

    def to_fitz_rect(self) -> fitz.Rect:
        return fitz.Rect(self.x0, self.y0, self.x1, self.y1)


@dataclass(frozen=True)
class AssetSpec:
    pdf: Path
    page: int
    crop: CropRect
    scale: float
    output: Path


def resolve_path(path_str: str) -> Path:
    path = Path(path_str)
    return path if path.is_absolute() else PROJECT_ROOT / path


def build_asset_spec(
    question_id: str,
    asset_key: str,
    payload: Any,
    pdf_aliases: dict[str, Path],
    default_pdf: Path,
    default_page: int,
    default_scale: float,
) -> AssetSpec:
    if isinstance(payload, list):
        spec_payload = {"crop": payload}
    elif isinstance(payload, dict):
        spec_payload = payload
    else:
        raise ValueError(f"{question_id}.{asset_key} must be a crop array or object")

    pdf_path = default_pdf
    if "pdf" in spec_payload:
        pdf_key = str(spec_payload["pdf"])
        if pdf_key not in pdf_aliases:
            raise ValueError(f"unknown pdf alias for {question_id}.{asset_key}: {pdf_key}")
        pdf_path = pdf_aliases[pdf_key]

    page = int(spec_payload.get("page", default_page))
    scale = float(spec_payload.get("scale", default_scale))
    crop = CropRect.from_json(spec_payload["crop"])

    suffix = "question" if asset_key == "questionImage" else "answer-area"
    output = OUTPUT_ROOT / f"{question_id}-{suffix}.png"
    return AssetSpec(pdf=pdf_path, page=page, crop=crop, scale=scale, output=output)


def load_asset_specs(map_path: Path, requested_ids: set[str] | None) -> list[AssetSpec]:
    payload = json.loads(map_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("asset map must be a JSON object")

    raw_pdfs = payload.get("pdfs")
    raw_assets = payload.get("assets")
    if not isinstance(raw_pdfs, dict) or not isinstance(raw_assets, dict):
        raise ValueError("asset map must contain object keys 'pdfs' and 'assets'")

    pdf_aliases = {key: resolve_path(str(value)) for key, value in raw_pdfs.items()}
    specs: list[AssetSpec] = []

    for question_id, asset_entry in raw_assets.items():
        if requested_ids and question_id not in requested_ids:
            continue

        if not isinstance(asset_entry, dict):
            raise ValueError(f"asset entry for {question_id} must be an object")

        pdf_key = str(asset_entry["pdf"])
        if pdf_key not in pdf_aliases:
            raise ValueError(f"unknown pdf alias for {question_id}: {pdf_key}")

        default_pdf = pdf_aliases[pdf_key]
        default_page = int(asset_entry["page"])
        default_scale = float(asset_entry.get("scale", 2.0))

        for asset_key in ("questionImage", "answerAreaImage"):
            if asset_key not in asset_entry:
                continue
            specs.append(
                build_asset_spec(
                    question_id=question_id,
                    asset_key=asset_key,
                    payload=asset_entry[asset_key],
                    pdf_aliases=pdf_aliases,
                    default_pdf=default_pdf,
                    default_page=default_page,
                    default_scale=default_scale,
                )
            )

    return specs


def render_asset(spec: AssetSpec, overwrite: bool) -> None:
    if not spec.pdf.exists():
        raise FileNotFoundError(f"PDF not found: {spec.pdf}")

    if spec.output.exists() and not overwrite:
        print(f"skip: {spec.output.relative_to(PROJECT_ROOT)}")
        return

    spec.output.parent.mkdir(parents=True, exist_ok=True)

    with fitz.open(spec.pdf) as document:
        if spec.page < 1 or spec.page > document.page_count:
            raise ValueError(f"page out of range for {spec.pdf.name}: {spec.page}")

        page = document[spec.page - 1]
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(spec.scale, spec.scale),
            clip=spec.crop.to_fitz_rect(),
            alpha=False,
        )
        pixmap.save(spec.output)

    print(f"saved: {spec.output.relative_to(PROJECT_ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract question PNG assets from source PDFs based on scripts/asset_map.json.",
    )
    parser.add_argument(
        "--map",
        type=Path,
        default=DEFAULT_MAP_PATH,
        help="Path to the asset map JSON file. Defaults to scripts/asset_map.json.",
    )
    parser.add_argument(
        "--id",
        action="append",
        default=[],
        help="Extract only the specified question id. Repeat to target multiple questions.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing output files.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    map_path = resolve_path(str(args.map))
    requested_ids = set(args.id) if args.id else None
    specs = load_asset_specs(map_path, requested_ids)

    if not specs:
        raise SystemExit("no assets matched the requested ids")

    for spec in specs:
        render_asset(spec, overwrite=args.overwrite)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
