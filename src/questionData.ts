import rawQuestions from "../data/questions.json";
import type { Question } from "./types";

export const questions = rawQuestions as Question[];

export const categories = ["すべて", "テクノロジ", "マネジメント", "ストラテジ"] as const;
