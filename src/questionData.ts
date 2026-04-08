import rawQuestions from "../data/questions.json";
import type { BattleSettings, ExamTerm, ExamYear, Question } from "./types";

export const questions = rawQuestions as Question[];

export const categories = ["すべて", "テクノロジ", "マネジメント", "ストラテジ"] as const;
export const yearOptions = ["すべて", "令和6", "令和5", "令和4"] as const;
export const seasonOptions = ["すべて", "春", "秋"] as const;

const yearOrder: ExamYear[] = ["令和6", "令和5", "令和4"];
const seasonOrder: ExamTerm[] = ["春", "秋"];

export type QuestionFilters = Pick<BattleSettings, "year" | "season" | "category">;

export function filterQuestions(source: Question[], filters: QuestionFilters): Question[] {
  return source.filter((question) => {
    const matchesYear = filters.year === "すべて" || question.year === filters.year;
    const matchesSeason = filters.season === "すべて" || question.season === filters.season;
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
