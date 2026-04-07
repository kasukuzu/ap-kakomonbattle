import { useMemo, useState } from "react";
import { HistoryScreen } from "./components/HistoryScreen";
import { QuizScreen } from "./components/QuizScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { SetupScreen } from "./components/SetupScreen";
import { TopScreen } from "./components/TopScreen";
import { questions } from "./questionData";
import { saveHistory } from "./storage";
import type { BattleResult, BattleSettings, PlayerKey, Question } from "./types";

type Screen = "top" | "setup" | "quiz" | "result" | "review" | "history";
type AnswerMap = Record<PlayerKey, number[]>;
const answerLabels = ["ア", "イ", "ウ", "エ"];

const defaultSettings: BattleSettings = {
  player1Name: "プレイヤー1",
  player2Name: "プレイヤー2",
  questionCount: 10,
  category: "すべて",
  questionOrder: "random",
};

function shuffleQuestions(source: Question[]): Question[] {
  const items = [...source];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function createBattleResult(
  settings: BattleSettings,
  quizQuestions: Question[],
  answers: AnswerMap,
): BattleResult {
  const countCorrect = (player: PlayerKey) =>
    quizQuestions.reduce((total, question, index) => {
      return total + (answers[player][index] === question.answer ? 1 : 0);
    }, 0);

  const player1Correct = countCorrect("player1");
  const player2Correct = countCorrect("player2");
  const questionCount = quizQuestions.length || 1;
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
    id: `${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    playedAt: new Date().toISOString(),
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

function App() {
  const [screen, setScreen] = useState<Screen>("top");
  const [settings, setSettings] = useState<BattleSettings>(defaultSettings);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [latestResult, setLatestResult] = useState<BattleResult | null>(null);

  const categoryCounts = useMemo(() => {
    return questions.reduce<Record<string, number>>(
      (counts, question) => {
        counts["すべて"] += 1;
        counts[question.category] = (counts[question.category] ?? 0) + 1;
        return counts;
      },
      { すべて: 0 },
    );
  }, []);

  const startBattle = (nextSettings: BattleSettings) => {
    const filtered =
      nextSettings.category === "すべて"
        ? questions
        : questions.filter((question) => question.category === nextSettings.category);
    const safeQuestionCount = Math.min(nextSettings.questionCount, filtered.length);
    const orderedQuestions =
      nextSettings.questionOrder === "random" ? shuffleQuestions(filtered) : filtered;
    const selected = orderedQuestions.slice(0, safeQuestionCount);
    setSettings({ ...nextSettings, questionCount: safeQuestionCount });
    setQuizQuestions(selected);
    setLatestResult(null);
    setScreen("quiz");
  };

  const finishBattle = (answers: AnswerMap) => {
    const result = createBattleResult(settings, quizQuestions, answers);
    saveHistory(result);
    setLatestResult(result);
    setScreen("result");
  };

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setScreen("top")}>
          応用情報 過去問バトル
        </button>
        <nav className="header-actions" aria-label="画面切り替え">
          <button type="button" onClick={() => setScreen("setup")}>
            対戦設定
          </button>
          <button type="button" onClick={() => setScreen("history")}>
            履歴
          </button>
        </nav>
      </header>

      <main>
        {screen === "top" && (
          <TopScreen onStart={() => setScreen("setup")} onHistory={() => setScreen("history")} />
        )}
        {screen === "setup" && (
          <SetupScreen
            categoryCounts={categoryCounts}
            defaultSettings={settings}
            onBack={() => setScreen("top")}
            onStart={startBattle}
          />
        )}
        {screen === "quiz" && (
          <QuizScreen
            questions={quizQuestions}
            settings={settings}
            onCancel={() => setScreen("setup")}
            onFinish={finishBattle}
          />
        )}
        {screen === "result" && latestResult && (
          <ResultScreen
            result={latestResult}
            onHistory={() => setScreen("history")}
            onRestart={() => setScreen("setup")}
            onReviewMistakes={() => setScreen("review")}
            onTop={() => setScreen("top")}
          />
        )}
        {screen === "review" && latestResult && (
          <ReviewScreen result={latestResult} onBack={() => setScreen("result")} />
        )}
        {screen === "history" && <HistoryScreen onBack={() => setScreen("top")} />}
      </main>
    </div>
  );
}

export default App;
