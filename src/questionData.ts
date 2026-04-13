import rawQuestions from "../data/questions.json";
import type { BattleSettings, ExamTerm, ExamYear, FilterOption, Question } from "./types";

export const questions = rawQuestions as Question[];
const questionMap = new Map(questions.map((question) => [question.id, question]));

export const categories = ["すべて", "テクノロジ", "マネジメント", "ストラテジ"] as const;
export const yearOptions = [
  "すべて",
  "令和6",
  "令和5",
  "令和4",
  "令和3",
  "令和2",
  "令和元",
  "平成31",
] as const;
export const seasonOptions = ["すべて", "春", "秋"] as const;

export const AVAILABLE_SEASONS_BY_YEAR = {
  すべて: ["すべて", "春", "秋"],
  令和6: ["すべて", "春", "秋"],
  令和5: ["すべて", "春", "秋"],
  令和4: ["すべて", "春", "秋"],
  令和3: ["すべて", "春", "秋"],
  令和2: ["なし"],
  令和元: ["秋"],
  平成31: ["春"],
} as const satisfies Record<FilterOption<ExamYear>, readonly FilterOption<ExamTerm>[]>;

const yearOrder: ExamYear[] = ["令和6", "令和5", "令和4", "令和3", "令和2", "令和元", "平成31"];
const seasonOrder: ExamTerm[] = ["春", "秋", "なし"];

export type QuestionFilters = Pick<BattleSettings, "year" | "season" | "category">;

export function getAvailableSeasonsForYear(year: FilterOption<ExamYear>) {
  return AVAILABLE_SEASONS_BY_YEAR[year] as readonly FilterOption<ExamTerm>[];
}

export function normalizeSeasonForYear(
  year: FilterOption<ExamYear>,
  season: FilterOption<ExamTerm>,
): FilterOption<ExamTerm> {
  const availableSeasons = getAvailableSeasonsForYear(year);
  return availableSeasons.includes(season) ? season : availableSeasons[0];
}

export function isSeasonSelectionLocked(year: FilterOption<ExamYear>) {
  return getAvailableSeasonsForYear(year).length === 1;
}

export function getSeasonSelectionDescription(year: FilterOption<ExamYear>) {
  if (year === "令和2") {
    return "令和2は1回開催のため、期はありません。";
  }

  if (year === "令和元") {
    return "令和元は秋のみです。";
  }

  if (year === "平成31") {
    return "平成31は春のみです。";
  }

  return "";
}

export function filterQuestions(source: Question[], filters: QuestionFilters): Question[] {
  const normalizedSeason = normalizeSeasonForYear(filters.year, filters.season);
  return source.filter((question) => {
    const matchesYear = filters.year === "すべて" || question.year === filters.year;
    const matchesSeason = normalizedSeason === "すべて" || question.season === normalizedSeason;
    const matchesCategory = filters.category === "すべて" || question.category === filters.category;
    return matchesYear && matchesSeason && matchesCategory;
  });
}

export function orderQuestions(source: Question[]): Question[] {
  return [...source].sort((a, b) => {
    const yearDiff = yearOrder.indexOf(a.year) - yearOrder.indexOf(b.year);
    if (yearDiff !== 0) {
      return yearDiff;
    }

    const seasonDiff = seasonOrder.indexOf(a.season) - seasonOrder.indexOf(b.season);
    if (seasonDiff !== 0) {
      return seasonDiff;
    }

    return a.questionNumber - b.questionNumber;
  });
}

export function formatFilterLabel(value: string): string {
  return value === "すべて" ? "全て" : value;
}

export function formatSeasonLabel(value: FilterOption<ExamTerm>) {
  if (value === "すべて") {
    return "全て";
  }

  if (value === "なし") {
    return "期なし";
  }

  return value;
}

export function getQuestionsByIds(ids: string[]): Question[] {
  return ids
    .map((id) => questionMap.get(id))
    .filter((question): question is Question => Boolean(question));
}
