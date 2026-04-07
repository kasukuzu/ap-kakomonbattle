import { useMemo, useState } from "react";
import type { BattleSettings, PlayerKey, Question } from "../types";

type QuizScreenProps = {
  settings: BattleSettings;
  questions: Question[];
  onCancel: () => void;
  onFinish: (answers: Record<PlayerKey, number[]>) => void;
};

type CurrentSelections = Record<PlayerKey, number | null>;

const emptySelections: CurrentSelections = {
  player1: null,
  player2: null,
};

export function QuizScreen({ settings, questions, onCancel, onFinish }: QuizScreenProps) {
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

  const playerScores = useMemo(() => {
    return {
      player1: answers.player1.filter((answer, index) => answer === questions[index]?.answer).length,
      player2: answers.player2.filter((answer, index) => answer === questions[index]?.answer).length,
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
          <span>
            {settings.player1Name}: {playerScores.player1}
          </span>
          <span>
            {settings.player2Name}: {playerScores.player2}
          </span>
        </div>
      </div>

      <article className="panel question-panel">
        <div className="question-meta">
          <span>{question.category}</span>
          <span>{question.season}</span>
          <span>{question.id}</span>
        </div>
        <p className="question-text">{question.question}</p>
        {question.questionImage && (
          <img
            className="question-image"
            src={question.questionImage}
            alt={`${question.id} の問題画像`}
          />
        )}
      </article>

      <div className="players-grid">
        <PlayerAnswerBox
          answerIndex={question.answer}
          choiceImages={question.choiceImages}
          choices={question.choices}
          isChecked={isChecked}
          name={settings.player1Name}
          player="player1"
          selected={selections.player1}
          onChoose={chooseAnswer}
        />
        <PlayerAnswerBox
          answerIndex={question.answer}
          choiceImages={question.choiceImages}
          choices={question.choices}
          isChecked={isChecked}
          name={settings.player2Name}
          player="player2"
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
  choices: string[];
  choiceImages?: Array<string | null>;
  selected: number | null;
  answerIndex: number;
  isChecked: boolean;
  onChoose: (player: PlayerKey, choiceIndex: number) => void;
};

function PlayerAnswerBox({
  name,
  player,
  choices,
  choiceImages,
  selected,
  answerIndex,
  isChecked,
  onChoose,
}: PlayerAnswerBoxProps) {
  const labels = ["ア", "イ", "ウ", "エ"];
  const isCorrect = selected === answerIndex;

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
      <div className="choice-list">
        {choices.map((choice, index) => {
          const selectedClass = selected === index ? " selected" : "";
          const correctClass = isChecked && answerIndex === index ? " correct-choice" : "";
          const wrongClass =
            isChecked && selected === index && selected !== answerIndex ? " wrong-choice" : "";

          return (
            <button
              className={`choice-button${selectedClass}${correctClass}${wrongClass}`}
              key={`${player}-${index}`}
              type="button"
              onClick={() => onChoose(player, index)}
            >
              <span className="choice-label">{labels[index]}</span>
              <span className="choice-content">
                <span>{choice}</span>
                {choiceImages?.[index] && (
                  <img
                    className="choice-image"
                    src={choiceImages[index]}
                    alt={`${labels[index]} の選択肢画像`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
