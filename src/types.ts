export type Category = "テクノロジ" | "マネジメント" | "ストラテジ";
export type ExamYear = "令和6" | "令和5" | "令和4";
export type ExamTerm = "春" | "秋";
export type FilterOption<T extends string> = T | "すべて";
export type BattleMode = "local" | "online";
export type QuestionOrder = "random" | "inOrder";

export type Question = {
  id: string;
  year: ExamYear;
  season: ExamTerm;
  examSession: string;
  section: string;
  questionNumber: number;
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
  year: FilterOption<ExamYear>;
  season: FilterOption<ExamTerm>;
  category: FilterOption<Category>;
  questionOrder: QuestionOrder;
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
  year: ExamYear;
  season: ExamTerm;
  examSession: string;
  questionNumber: number;
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
  mode: BattleMode;
  roomCode?: string;
  playedAt: string;
  startedAt?: number | null;
  finishedAt?: number | null;
  elapsedMs: number;
  settings: BattleSettings;
  questionIds: string[];
  questionResults: QuestionResult[];
  player1: PlayerResult;
  player2: PlayerResult;
  winner: "player1" | "player2" | "draw";
};

export type OnlineRoomStatus = "waiting" | "ready" | "playing" | "finished";

export type OnlineRoomPlayer = {
  uid: string;
  name: string;
  connected: boolean;
  joinedAt: number;
  lastSeenAt?: number | null;
  currentQuestionIndex: number;
  answeredCount: number;
  finished: boolean;
};

export type OnlineRoomAnswer = {
  selectedIndex: number;
  answeredAt: number;
};

export type OnlineRoom = {
  roomCode: string;
  status: OnlineRoomStatus;
  createdAt: number;
  startedAt?: number | null;
  finishedAt?: number | null;
  settings: BattleSettings;
  players: Partial<Record<PlayerKey, OnlineRoomPlayer>>;
  questionIds: string[];
  answers: Record<PlayerKey, Record<string, OnlineRoomAnswer>>;
  result?: BattleResult | null;
};

export type OnlineSession = {
  roomCode: string;
  playerKey: PlayerKey;
  uid: string;
};
