import { useMemo, useState } from "react";
import { countCorrectAnswers } from "../battle";
import { useElapsedTime } from "../hooks/useElapsedTime";
import type { BattleSettings, PlayerKey, Question } from "../types";
import { ChoiceList } from "./ChoiceList";
import { QuestionCard } from "./QuestionCard";

type QuizScreenProps = {
  settings: BattleSettings;
  questions: Question[];
  startedAt: number | null;
  onCancel: () => void;
  onFinish: (answers: Record<PlayerKey, number[]>) => void;
};

type CurrentSelections = Record<PlayerKey, number | null>;

const emptySelections: CurrentSelections = {
  player1: null,
  player2: null,
} as const;

export function QuizScreen({ settings, questions, startedAt, onCancel, onFinish }: QuizScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<CurrentSelections>(emptySelections);
  const [isChecked, setIsChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<PlayerKey, number[]>>({
    player1: [],
    player2: [],
  });

  const question = questions[currentIndex];
  const progressText = `${currentIndex + 1} / ${questions.length}`;
  const bothSelected = selections.player1 !== null && selections.player2 !== null;
  const { formattedElapsed } = useElapsedTime(startedAt);

  const playerScores = useMemo(() => {
    return {
      player1: countCorrectAnswers(questions, answers, "player1"),
      player2: countCorrectAnswers(questions, answers, "player2"),
    };
  }, [answers, questions]);

  if (!question) {
    return (
      <section className="screen narrow-screen">
        <div className="panel">
          <h1>問題がありません</h1>
          <button type="button" onClick={onCancel}>
            設定に戻る
          </button>
        </div>
      </section>
    );
  }

  const chooseAnswer = (player: PlayerKey, choiceIndex: number) => {
    if (isChecked) {
      return;
    }
    setSelections((current) => ({ ...current, [player]: choiceIndex }));
  };

  const checkAnswer = () => {
    if (!bothSelected) {
      return;
    }
    setIsChecked(true);
  };

  const goNext = () => {
    if (selections.player1 === null || selections.player2 === null) {
      return;
    }

    const nextAnswers = {
      player1: [...answers.player1, selections.player1],
      player2: [...answers.player2, selections.player2],
    };

    if (currentIndex === questions.length - 1) {
      onFinish(nextAnswers);
      return;
    }

    setAnswers(nextAnswers);
    setCurrentIndex((index) => index + 1);
    setSelections(emptySelections);
    setIsChecked(false);
  };

  return (
    <section className="screen quiz-screen">
      <div className="quiz-topbar">
        <div>
          <p className="eyebrow">クイズ</p>
          <h1>{progressText}</h1>
        </div>
        <div className="score-mini">
          <span className="timer-chip">経過 {formattedElapsed}</span>
          <span>
            {settings.player1Name}: {playerScores.player1}
          </span>
          <span>
            {settings.player2Name}: {playerScores.player2}
          </span>
        </div>
      </div>

      <QuestionCard question={question} />

      <div className="players-grid">
        <PlayerAnswerBox
          isChecked={isChecked}
          name={settings.player1Name}
          player="player1"
          question={question}
          selected={selections.player1}
          onChoose={chooseAnswer}
        />
        <PlayerAnswerBox
          isChecked={isChecked}
          name={settings.player2Name}
          player="player2"
          question={question}
          selected={selections.player2}
          onChoose={chooseAnswer}
        />
      </div>

      {isChecked && (
        <div className="panel answer-panel">
          <strong>正解: {question.answerLabel}</strong>
          <span>{question.choices[question.answer]}</span>
        </div>
      )}

      <div className="button-row">
        {!isChecked ? (
          <button className="primary-button" type="button" onClick={checkAnswer} disabled={!bothSelected}>
            回答する
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={goNext}>
            {currentIndex === questions.length - 1 ? "結果へ" : "次の問題へ"}
          </button>
        )}
        <button type="button" onClick={onCancel}>
          中断
        </button>
      </div>
    </section>
  );
}

type PlayerAnswerBoxProps = {
  name: string;
  player: PlayerKey;
  question: Question;
  selected: number | null;
  isChecked: boolean;
  onChoose: (player: PlayerKey, choiceIndex: number) => void;
};

function PlayerAnswerBox({
  name,
  player,
  question,
  selected,
  isChecked,
  onChoose,
}: PlayerAnswerBoxProps) {
  const isCorrect = selected === question.answer;

  return (
    <section className="panel player-panel">
      <div className="player-title">
        <h2>{name}</h2>
        {isChecked && (
          <span className={isCorrect ? "badge correct" : "badge wrong"}>
            {isCorrect ? "正解" : "不正解"}
          </span>
        )}
      </div>
      <ChoiceList
        answerIndex={question.answer}
        choiceImages={question.choiceImages}
        choices={question.choices}
        disabled={isChecked}
        revealAnswer={isChecked}
        selectedIndex={selected}
        onSelect={(choiceIndex) => onChoose(player, choiceIndex)}
      />
    </section>
  );
}
