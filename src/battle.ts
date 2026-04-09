import { filterQuestions, orderQuestions } from "./questionData";
import type {
  BattleMode,
  BattleResult,
  BattleSettings,
  OnlineRoom,
  PlayerKey,
  Question,
} from "./types";

export const answerLabels = ["ア", "イ", "ウ", "エ"] as const;
export type AnswerMap = Record<PlayerKey, number[]>;

export function shuffleQuestions(source: Question[]): Question[] {
  const items = [...source];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function selectQuestions(source: Question[], settings: BattleSettings): Question[] {
  const filtered = filterQuestions(source, settings);
  const safeQuestionCount = Math.min(settings.questionCount, filtered.length);
  const orderedQuestions =
    settings.questionOrder === "random" ? shuffleQuestions(filtered) : orderQuestions(filtered);

  return orderedQuestions.slice(0, safeQuestionCount);
}

export function countCorrectAnswers(
  quizQuestions: Question[],
  answers: AnswerMap,
  player: PlayerKey,
): number {
  return quizQuestions.reduce((total, question, index) => {
    return total + (answers[player][index] === question.answer ? 1 : 0);
  }, 0);
}

export function buildAnswerMapFromOnlineRoom(
  quizQuestions: Question[],
  room: OnlineRoom,
): AnswerMap {
  return {
    player1: quizQuestions.map((question) => room.answers[question.id]?.player1?.selectedIndex ?? -1),
    player2: quizQuestions.map((question) => room.answers[question.id]?.player2?.selectedIndex ?? -1),
  };
}

export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CreateBattleResultOptions = {
  mode?: BattleMode;
  roomCode?: string;
  startedAt?: number | null;
  finishedAt?: number | null;
  playedAt?: string;
};

export function createBattleResult(
  settings: BattleSettings,
  quizQuestions: Question[],
  answers: AnswerMap,
  options: CreateBattleResultOptions = {},
): BattleResult {
  const player1Correct = countCorrectAnswers(quizQuestions, answers, "player1");
  const player2Correct = countCorrectAnswers(quizQuestions, answers, "player2");
  const questionCount = quizQuestions.length || 1;
  const finishedAt = options.finishedAt ?? Date.now();
  const startedAt = options.startedAt ?? null;
  const elapsedMs = startedAt ? Math.max(0, finishedAt - startedAt) : 0;
  const questionResults = quizQuestions.map((question, index) => {
    const createPlayerAnswer = (player: PlayerKey) => {
      const selectedIndex = answers[player][index] ?? -1;
      return {
        selectedIndex,
        selectedLabel: answerLabels[selectedIndex] ?? "-",
        selectedText: question.choices[selectedIndex] ?? "未回答",
        selectedImage: question.choiceImages?.[selectedIndex] ?? null,
        isCorrect: selectedIndex === question.answer,
      };
    };

    return {
      questionId: question.id,
      order: index + 1,
      year: question.year,
      season: question.season,
      examSession: question.examSession,
      questionNumber: question.questionNumber,
      category: question.category,
      question: question.question,
      questionImage: question.questionImage,
      choices: question.choices,
      choiceImages: question.choiceImages,
      correctAnswer: question.answer,
      correctAnswerLabel: question.answerLabel,
      correctAnswerText: question.choices[question.answer] ?? "",
      correctAnswerImage: question.choiceImages?.[question.answer] ?? null,
      player1: createPlayerAnswer("player1"),
      player2: createPlayerAnswer("player2"),
    };
  });
  const winner =
    player1Correct === player2Correct
      ? "draw"
      : player1Correct > player2Correct
        ? "player1"
        : "player2";

  return {
    id: `${finishedAt}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    mode: options.mode ?? "local",
    roomCode: options.roomCode,
    playedAt: options.playedAt ?? new Date(finishedAt).toISOString(),
    startedAt,
    finishedAt,
    elapsedMs,
    settings,
    questionIds: quizQuestions.map((question) => question.id),
    questionResults,
    player1: {
      name: settings.player1Name,
      correctCount: player1Correct,
      accuracy: Math.round((player1Correct / questionCount) * 100),
    },
    player2: {
      name: settings.player2Name,
      correctCount: player2Correct,
      accuracy: Math.round((player2Correct / questionCount) * 100),
    },
    winner,
  };
}
