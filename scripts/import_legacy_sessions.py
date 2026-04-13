#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
import urllib.request
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_PATH = PROJECT_ROOT / "data" / "questions.json"

LABEL_TO_INDEX = {"ア": 0, "イ": 1, "ウ": 2, "エ": 3}
CATEGORY_MAP = {
    "テクノロジ系": "テクノロジ",
    "マネジメント系": "マネジメント",
    "ストラテジ系": "ストラテジ",
}


@dataclass(frozen=True)
class SessionConfig:
    key: str
    path: str
    year: str
    season: str
    exam_session: str
    id_prefix: str
    question_pdf: str
    answer_pdf: str


SESSIONS: tuple[SessionConfig, ...] = (
    SessionConfig(
        key="r3-autumn",
        path="03_aki",
        year="令和3",
        season="秋",
        exam_session="令和3年秋",
        id_prefix="r3-autumn-am",
        question_pdf="data/raw/r3-autumn-questions.pdf",
        answer_pdf="data/raw/r3-autumn-answers.pdf",
    ),
    SessionConfig(
        key="r3-spring",
        path="03_haru",
        year="令和3",
        season="春",
        exam_session="令和3年春",
        id_prefix="r3-spring-am",
        question_pdf="data/raw/r3-spring-questions.pdf",
        answer_pdf="data/raw/r3-spring-answers.pdf",
    ),
    SessionConfig(
        key="r2",
        path="02_aki",
        year="令和2",
        season="なし",
        exam_session="令和2年",
        id_prefix="r2-am",
        question_pdf="data/raw/r2-questions.pdf",
        answer_pdf="data/raw/r2-answers.pdf",
    ),
    SessionConfig(
        key="r1-autumn",
        path="01_aki",
        year="令和元",
        season="秋",
        exam_session="令和元年秋",
        id_prefix="r1-autumn-am",
        question_pdf="data/raw/r-autumn-questions.pdf",
        answer_pdf="data/raw/r-autumn-answers.pdf",
    ),
    SessionConfig(
        key="h31-spring",
        path="31_haru",
        year="平成31",
        season="春",
        exam_session="平成31年春",
        id_prefix="h31-spring-am",
        question_pdf="data/raw/h31-spring-questions.pdf",
        answer_pdf="data/raw/h31-spring-answers.pdf",
    ),
)


def ensure_local_sources() -> None:
    missing_files = []
    for session in SESSIONS:
        for raw_path in (session.question_pdf, session.answer_pdf):
            path = PROJECT_ROOT / raw_path
            if not path.exists():
                missing_files.append(raw_path)

    if missing_files:
        missing = "\n".join(missing_files)
        raise SystemExit(f"missing local source pdfs:\n{missing}")


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


def extract(pattern: str, source: str, *, flags: int = re.DOTALL) -> str:
    match = re.search(pattern, source, flags)
    if not match:
        raise ValueError(f"pattern not found: {pattern}")
    return match.group(1)


def parse_category(classification_html: str) -> str:
    for key, value in CATEGORY_MAP.items():
        if key in classification_html:
            return value
    raise ValueError(f"unknown category: {classification_html}")


def parse_choice(choice_html: str, label: str) -> str:
    text = strip_tags(choice_html)
    if text:
        return text

    if "<img" in choice_html.lower():
        return f"{label}（画像選択肢）"

    return label


def parse_choices(page_html: str) -> list[str]:
    span_patterns = {
        "ア": r'<span id="select_a">(.*?)</span>',
        "イ": r'<span id="select_i">(.*?)</span>',
        "ウ": r'<span id="select_u">(.*?)</span>',
        "エ": r'<span id="select_e">(.*?)</span>',
    }

    if all(re.search(pattern, page_html, re.DOTALL) for pattern in span_patterns.values()):
        return [
            parse_choice(extract(span_patterns["ア"], page_html), "ア"),
            parse_choice(extract(span_patterns["イ"], page_html), "イ"),
            parse_choice(extract(span_patterns["ウ"], page_html), "ウ"),
            parse_choice(extract(span_patterns["エ"], page_html), "エ"),
        ]

    answer_area_html = extract(
        r'<div class="ansbg"[^>]*>(.*?)</div>\s*<div id="ans">',
        page_html,
    )
    labels = re.findall(r'<button class="selectBtn"[^>]*>([アイウエ])</button>', answer_area_html)
    if labels == ["ア", "イ", "ウ", "エ"]:
        return [f"{label}（画像選択肢）" for label in labels]

    raise ValueError("unsupported choice layout")


def parse_question_page(session: SessionConfig, question_number: int) -> dict[str, object]:
    url = f"https://www.ap-siken.com/kakomon/{session.path}/q{question_number}.html"
    page_html = fetch(url)

    mondai_html = extract(r'<div id="mondai">(.*?)</div>\s*<div class="ansbg"', page_html)
    classification_html = extract(r"<h3>分類 :</h3>\s*<div>(.*?)</div>", page_html)
    answer_label = extract(r'<span id="answerChar">([アイウエ])</span>', page_html)

    question_text = strip_tags(mondai_html)
    if not question_text:
        question_text = "[問題文抽出失敗]"

    if "<img" in mondai_html.lower() and "[図表あり]" not in question_text:
        question_text = f"{question_text}\n\n[図表あり]"

    choices = parse_choices(page_html)

    return {
        "id": f"{session.id_prefix}-{question_number}",
        "year": session.year,
        "season": session.season,
        "examSession": session.exam_session,
        "section": "午前",
        "questionNumber": question_number,
        "category": parse_category(classification_html),
        "question": question_text,
        "choices": choices,
        "answer": LABEL_TO_INDEX[answer_label],
        "answerLabel": answer_label,
        "explanation": "",
    }


def build_session_questions(session: SessionConfig) -> list[dict[str, object]]:
    print(f"fetching {session.key} ...")
    questions = [parse_question_page(session, number) for number in range(1, 81)]
    if len(questions) != 80:
        raise ValueError(f"{session.key}: expected 80 questions, got {len(questions)}")
    return questions


def main() -> int:
    ensure_local_sources()

    current_questions = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    filtered_questions = [
        item
        for item in current_questions
        if not any(str(item.get("id", "")).startswith(f"{session.id_prefix}-") for session in SESSIONS)
    ]

    generated_questions: list[dict[str, object]] = []
    for session in SESSIONS:
        generated_questions.extend(build_session_questions(session))

    merged_questions = filtered_questions + generated_questions
    QUESTIONS_PATH.write_text(
        json.dumps(merged_questions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"updated {QUESTIONS_PATH} with {len(generated_questions)} new questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
