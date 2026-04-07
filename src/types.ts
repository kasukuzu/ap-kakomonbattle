export type Category = "テクノロジ" | "マネジメント" | "ストラテジ";

export type Question = {
  id: string;
  season: string;
  exam: string;
  section: string;
  category: Category;
  question: string;
  questionImage?: string;
  choices: string[];
  choiceImages?: Array<string | null>;
  answer: number;
  answerLabel: string;
  explanation: string;
};

export type PlayerKey = "player1" | "player2";

export type BattleSettings = {
  player1Name: string;
  player2Name: string;
  questionCount: number;
  category: Category | "すべて";
  questionOrder: "random" | "inOrder";
};

export type PlayerResult = {
  name: string;
  correctCount: number;
  accuracy: number;
};

export type PlayerQuestionAnswer = {
  selectedIndex: number;
  selectedLabel: string;
  selectedText: string;
  selectedImage?: string | null;
  isCorrect: boolean;
};

export type QuestionResult = {
  questionId: string;
  order: number;
  category: Category;
  question: string;
  questionImage?: string;
  choices: string[];
  choiceImages?: Array<string | null>;
  correctAnswer: number;
  correctAnswerLabel: string;
  correctAnswerText: string;
  correctAnswerImage?: string | null;
  player1: PlayerQuestionAnswer;
  player2: PlayerQuestionAnswer;
};

export type BattleResult = {
  id: string;
  playedAt: string;
  settings: BattleSettings;
  questionIds: string[];
  questionResults: QuestionResult[];
  player1: PlayerResult;
  player2: PlayerResult;
  winner: "player1" | "player2" | "draw";
};
