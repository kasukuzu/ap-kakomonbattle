#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
import shutil
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

import fitz


PROJECT_ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_PATH = PROJECT_ROOT / "data" / "questions.json"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "question-assets"

SESSION_PATHS = {
    ("令和6", "秋"): "06_aki",
    ("令和6", "春"): "06_haru",
    ("令和5", "秋"): "05_aki",
    ("令和5", "春"): "05_haru",
    ("令和4", "秋"): "04_aki",
    ("令和4", "春"): "04_haru",
    ("令和3", "秋"): "03_aki",
    ("令和3", "春"): "03_haru",
    ("令和2", "なし"): "02_aki",
    ("令和元", "秋"): "01_aki",
    ("平成31", "春"): "31_haru",
}

LABEL_BY_SPAN_ID = {
    "select_a": "ア",
    "select_i": "イ",
    "select_u": "ウ",
    "select_e": "エ",
}


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def download_binary(url: str, destination: Path) -> None:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        destination.write_bytes(response.read())


def extract(pattern: str, source: str, *, flags: int = re.DOTALL) -> str:
    match = re.search(pattern, source, flags)
    if not match:
        raise ValueError(f"pattern not found: {pattern}")
    return match.group(1)


def strip_tags(fragment: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", fragment, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<img\b[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def get_question_page_url(question: dict[str, object]) -> str:
    year = str(question["year"])
    season = str(question["season"])
    session_path = SESSION_PATHS[(year, season)]
    question_number = int(question["questionNumber"])
    return f"https://www.ap-siken.com/kakomon/{session_path}/q{question_number}.html"


def parse_question_fragment(page_html: str) -> str:
    return extract(r'<div id="mondai">(.*?)</div>\s*<div class="ansbg"', page_html)


def parse_answer_fragment(page_html: str) -> str:
    return extract(r'<div class="ansbg"[^>]*>(.*?)</div>\s*<div id="ans">', page_html)


def collect_question_images(question_url: str, fragment_html: str) -> list[tuple[str | None, str]]:
    image_paths = re.findall(r'<img\b[^>]*src="([^"]+)"', fragment_html)
    return [(None, urljoin(question_url, image_path)) for image_path in image_paths]


def collect_answer_images(question_url: str, fragment_html: str) -> list[tuple[str | None, str]]:
    labeled_images: list[tuple[str | None, str]] = []

    for span_id, label in LABEL_BY_SPAN_ID.items():
        match = re.search(rf'<span id="{span_id}">(.*?)</span>', fragment_html, re.DOTALL)
        if not match:
            continue
        image_paths = re.findall(r'<img\b[^>]*src="([^"]+)"', match.group(1))
        labeled_images.extend((label, urljoin(question_url, image_path)) for image_path in image_paths)

    if labeled_images:
        return labeled_images

    image_paths = re.findall(r'<img\b[^>]*src="([^"]+)"', fragment_html)
    return [(None, urljoin(question_url, image_path)) for image_path in image_paths]


def compose_images(
    items: list[tuple[str | None, str]],
    output_path: Path,
) -> bool:
    if not items:
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if len(items) == 1 and items[0][0] is None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "single-image"
            download_binary(items[0][1], temp_path)
            shutil.copyfile(temp_path, output_path)
        return True

    padding = 18
    gap = 14
    label_height = 28

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        downloaded_items: list[tuple[str | None, Path, fitz.Pixmap]] = []

        for index, (label, url) in enumerate(items):
            temp_path = temp_dir_path / f"asset-{index}.png"
            download_binary(url, temp_path)
            downloaded_items.append((label, temp_path, fitz.Pixmap(str(temp_path))))

        max_width = max(pixmap.width for _, _, pixmap in downloaded_items)
        total_height = padding
        for label, _, pixmap in downloaded_items:
            total_height += (label_height if label else 0) + pixmap.height + gap
        total_height += padding - gap

        document = fitz.open()
        page = document.new_page(width=max_width + padding * 2, height=total_height)
        y = padding

        for label, temp_path, pixmap in downloaded_items:
            if label:
                page.insert_text(
                    fitz.Point(padding, y + 18),
                    label,
                    fontsize=16,
                    fontname="helv",
                    fill=(0.12, 0.26, 0.45),
                )
                y += label_height

            rect = fitz.Rect(padding, y, padding + pixmap.width, y + pixmap.height)
            page.insert_image(rect, filename=str(temp_path))
            y += pixmap.height + gap
            pixmap = None

        rendered = page.get_pixmap(alpha=False)
        rendered.save(output_path)
        document.close()

    return True


def clean_question_text(text: str) -> str:
    cleaned = text.replace("\n\n[図表あり]", "")
    cleaned = cleaned.replace("[図表あり]", "")
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def needs_question_image(question: dict[str, object]) -> bool:
    return "[図表あり]" in str(question.get("question", "")) and not question.get("questionImage")


def needs_answer_area_image(question: dict[str, object]) -> bool:
    choices_text = " ".join(question.get("choices", []))
    return "画像選択肢" in choices_text and not question.get("answerAreaImage") and not question.get("choiceImages")


def main() -> int:
    questions: list[dict[str, object]] = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    updated_questions = 0
    generated_question_assets = 0
    generated_answer_assets = 0

    for question in questions:
        needs_question = needs_question_image(question)
        needs_answer = needs_answer_area_image(question)
        if not needs_question and not needs_answer:
            continue

        page_url = get_question_page_url(question)
        page_html = fetch(page_url)

        if needs_question:
            question_fragment = parse_question_fragment(page_html)
            question_images = collect_question_images(page_url, question_fragment)
            if compose_images(question_images, OUTPUT_ROOT / f"{question['id']}-question.png"):
                question["questionImage"] = f"/question-assets/{question['id']}-question.png"
                question["question"] = clean_question_text(str(question["question"]))
                generated_question_assets += 1

        if needs_answer:
            answer_fragment = parse_answer_fragment(page_html)
            answer_images = collect_answer_images(page_url, answer_fragment)
            if compose_images(answer_images, OUTPUT_ROOT / f"{question['id']}-answer-area.png"):
                question["answerAreaImage"] = f"/question-assets/{question['id']}-answer-area.png"
                generated_answer_assets += 1

        updated_questions += 1
        print(f"processed {question['id']}")

    QUESTIONS_PATH.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"updated questions: {updated_questions}, "
        f"question assets: {generated_question_assets}, "
        f"answer assets: {generated_answer_assets}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
