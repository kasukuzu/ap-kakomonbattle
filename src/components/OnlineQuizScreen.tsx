import { useEffect, useMemo, useState } from "react";
import { buildAnswerMapFromOnlineRoom, countCorrectAnswers } from "../battle";
import { useElapsedTime } from "../hooks/useElapsedTime";
import type { OnlineRoom, OnlineSession, PlayerKey, Question } from "../types";
import { ChoiceList } from "./ChoiceList";
import { QuestionCard } from "./QuestionCard";

type OnlineQuizScreenProps = {
  room: OnlineRoom;
  session: OnlineSession;
  questions: Question[];
  isSubmitting: boolean;
  actionError: string;
  onLeave: () => void;
  onSubmitAnswer: (selectedIndex: number) => void;
  onAdvance: () => void;
};

function getOpponentKey(playerKey: PlayerKey): PlayerKey {
  return playerKey === "player1" ? "player2" : "player1";
}

export function OnlineQuizScreen({
  room,
  session,
  questions,
  isSubmitting,
  actionError,
  onLeave,
  onSubmitAnswer,
  onAdvance,
}: OnlineQuizScreenProps) {
  const question = questions[room.currentQuestionIndex];
  const [draftSelection, setDraftSelection] = useState<number | null>(null);
  const { formattedElapsed } = useElapsedTime(room.startedAt);
  const opponentKey = getOpponentKey(session.playerKey);
  const myName = room.settings[session.playerKey === "player1" ? "player1Name" : "player2Name"];
  const opponentName = room.settings[opponentKey === "player1" ? "player1Name" : "player2Name"];

  useEffect(() => {
    setDraftSelection(null);
  }, [question?.id]);

  const scoreMap = useMemo(() => {
    const answers = buildAnswerMapFromOnlineRoom(questions, room);
    return {
      player1: countCorrectAnswers(questions, answers, "player1"),
      player2: countCorrectAnswers(questions, answers, "player2"),
    };
  }, [questions, room]);

  if (!question) {
    return (
      <section className="screen narrow-screen">
        <div className="panel empty-state">出題データを読み込めませんでした。</div>
        <div className="button-row">
          <button type="button" onClick={onLeave}>
            戻る
          </button>
        </div>
      </section>
    );
  }

  const myAnswer = room.answers[question.id]?.[session.playerKey];
  const opponentAnswer = room.answers[question.id]?.[opponentKey];
  const bothAnswered = Boolean(myAnswer && opponentAnswer);
  const opponentDisconnected = room.players[opponentKey]?.connected === false;
  const progressText = `${room.currentQuestionIndex + 1} / ${questions.length}`;
  const selectedIndex = myAnswer?.selectedIndex ?? draftSelection;

  return (
    <section className="screen quiz-screen">
      <div className="quiz-topbar">
        <div>
          <p className="eyebrow">オンライン対戦</p>
          <h1>{progressText}</h1>
        </div>
        <div className="score-mini">
          <span>経過 {formattedElapsed}</span>
          <span>{room.settings.player1Name}: {scoreMap.player1}</span>
          <span>{room.settings.player2Name}: {scoreMap.player2}</span>
        </div>
      </div>

      <QuestionCard question={question} />

      <div className="players-grid">
        <section className="panel player-panel">
          <div className="player-title">
            <h2>{myName}</h2>
            {myAnswer ? (
              <span className={myAnswer.selectedIndex === question.answer ? "badge correct" : "badge wrong"}>
                {myAnswer.selectedIndex === question.answer ? "正解" : "不正解"}
              </span>
            ) : (
              <span className="badge">未回答</span>
            )}
          </div>
          <ChoiceList
            answerIndex={question.answer}
            choiceImages={question.choiceImages}
            choices={question.choices}
            disabled={Boolean(myAnswer)}
            revealAnswer={bothAnswered}
            selectedIndex={selectedIndex}
            onSelect={setDraftSelection}
          />
          <div className="button-row">
            <button
              className="primary-button"
              disabled={selectedIndex === null || Boolean(myAnswer) || isSubmitting}
              type="button"
              onClick={() => selectedIndex !== null && onSubmitAnswer(selectedIndex)}
            >
              {myAnswer ? "回答済み" : isSubmitting ? "送信中..." : "回答を送信"}
            </button>
          </div>
          {myAnswer && !bothAnswered && (
            <p className="subtle-text">回答済みです。相手の回答を待っています。</p>
          )}
        </section>

        <section className="panel player-panel">
          <div className="player-title">
            <h2>{opponentName}</h2>
            <span className={`badge ${opponentDisconnected ? "wrong" : opponentAnswer ? "correct" : ""}`}>
              {opponentDisconnected ? "切断" : opponentAnswer ? "回答済み" : "回答待ち"}
            </span>
          </div>
          {!bothAnswered ? (
            <p className="subtle-text">
              {opponentDisconnected
                ? "相手が切断しました。再接続を待っています。"
                : "相手の回答を待っています。"}
            </p>
          ) : (
            <div className="review-player-answer is-correct">
              <p>
                正解: {question.answerLabel} / {question.choices[question.answer]}
              </p>
              <p>
                {myName}: {question.choices[myAnswer?.selectedIndex ?? -1] ?? "未回答"}
              </p>
              <p>
                {opponentName}: {question.choices[opponentAnswer?.selectedIndex ?? -1] ?? "未回答"}
              </p>
            </div>
          )}
          {bothAnswered && session.playerKey === "player1" && (
            <div className="button-row">
              <button className="primary-button" type="button" onClick={onAdvance}>
                {room.currentQuestionIndex === questions.length - 1 ? "結果へ進む" : "次の問題へ"}
              </button>
            </div>
          )}
          {bothAnswered && session.playerKey === "player2" && (
            <p className="subtle-text">ホストが次の問題へ進めます。</p>
          )}
        </section>
      </div>

      {actionError && <p className="form-message error-message">{actionError}</p>}

      <div className="button-row">
        <button type="button" onClick={onLeave}>
          退出する
        </button>
      </div>
    </section>
  );
}
