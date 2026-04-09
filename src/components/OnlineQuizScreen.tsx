import { useEffect, useMemo, useState } from "react";
import { buildAnswerMapFromOnlineRoom, countCorrectAnswers } from "../battle";
import { useElapsedTime } from "../hooks/useElapsedTime";
import type { OnlineRoom, OnlineSession, PlayerKey, Question } from "../types";
import { ChoiceList } from "./ChoiceList";
import { LoadingSpinner } from "./LoadingSpinner";
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

type ProgressGaugeProps = {
  label: string;
  currentStep: number;
  answeredCount: number;
  total: number;
  complete: boolean;
  disconnected?: boolean;
};

function getOpponentKey(playerKey: PlayerKey): PlayerKey {
  return playerKey === "player1" ? "player2" : "player1";
}

function ProgressGauge({
  label,
  currentStep,
  answeredCount,
  total,
  complete,
  disconnected = false,
}: ProgressGaugeProps) {
  const safeTotal = Math.max(total, 1);
  const displayStep = complete ? total : Math.min(currentStep, total);
  const progressPercent = total > 0 ? Math.min((displayStep / safeTotal) * 100, 100) : 0;
  const indicatorLeft =
    progressPercent <= 0
      ? "0px"
      : progressPercent >= 100
        ? "calc(100% - 14px)"
        : `calc(${progressPercent}% - 7px)`;

  return (
    <section className={`panel progress-gauge${complete ? " is-complete" : ""}`}>
      <div className="progress-meta">
        <strong>{label}</strong>
        <span>{complete ? `${label} 完了` : `${label} ${displayStep} / ${total}`}</span>
      </div>
      <div className={`progress-track${disconnected ? " is-disconnected" : ""}`}>
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        <span className="progress-thumb" style={{ left: indicatorLeft }} />
      </div>
      <p className="subtle-text progress-caption">
        {disconnected ? "接続が切れています" : `回答済み ${Math.min(answeredCount, total)} / ${total}`}
      </p>
    </section>
  );
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
  const [draftSelection, setDraftSelection] = useState<number | null>(null);
  const { formattedElapsed } = useElapsedTime(room.startedAt);
  const opponentKey = getOpponentKey(session.playerKey);
  const myPlayer = room.players[session.playerKey];
  const opponentPlayer = room.players[opponentKey];
  const myName = room.settings[session.playerKey === "player1" ? "player1Name" : "player2Name"];
  const opponentName = room.settings[opponentKey === "player1" ? "player1Name" : "player2Name"];

  useEffect(() => {
    setDraftSelection(null);
  }, [myPlayer?.currentQuestionIndex, myPlayer?.finished]);

  const scoreMap = useMemo(() => {
    const answers = buildAnswerMapFromOnlineRoom(questions, room);
    return {
      player1: countCorrectAnswers(questions, answers, "player1"),
      player2: countCorrectAnswers(questions, answers, "player2"),
    };
  }, [questions, room]);

  if (!myPlayer) {
    return (
      <section className="screen narrow-screen">
        <div className="panel empty-state">プレイヤー情報を読み込めませんでした。</div>
        <div className="button-row">
          <button type="button" onClick={onLeave}>
            戻る
          </button>
        </div>
      </section>
    );
  }

  const question = questions[myPlayer.currentQuestionIndex];
  if (!question && !myPlayer.finished) {
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

  const myAnswer = question ? room.answers[session.playerKey]?.[question.id] : undefined;
  const hasSubmitted = Boolean(myAnswer);
  const selectedIndex = myAnswer?.selectedIndex ?? draftSelection;
  const isLastQuestion = myPlayer.currentQuestionIndex >= questions.length - 1;
  const opponentDisconnected = opponentPlayer?.connected === false;
  const myStep = myPlayer.finished
    ? questions.length
    : Math.min(myPlayer.currentQuestionIndex + 1, questions.length);
  const opponentStep = opponentPlayer?.finished
    ? questions.length
    : Math.min((opponentPlayer?.currentQuestionIndex ?? 0) + 1, questions.length);
  const progressText = myPlayer.finished ? `完了 / ${questions.length}` : `${myStep} / ${questions.length}`;

  return (
    <section className="screen quiz-screen">
      <div className="quiz-topbar">
        <div>
          <p className="eyebrow">オンライン対戦</p>
          <h1>{progressText}</h1>
        </div>
        <div className="score-mini">
          <span className="timer-chip">経過 {formattedElapsed}</span>
          <span>{room.settings.player1Name}: {scoreMap.player1}</span>
          <span>{room.settings.player2Name}: {scoreMap.player2}</span>
        </div>
      </div>

      <div className="progress-board">
        <ProgressGauge
          answeredCount={myPlayer.answeredCount}
          complete={myPlayer.finished}
          currentStep={myStep}
          label="自分"
          total={questions.length}
        />
        <ProgressGauge
          answeredCount={opponentPlayer?.answeredCount ?? 0}
          complete={opponentPlayer?.finished === true}
          currentStep={opponentStep}
          disconnected={opponentDisconnected}
          label="相手"
          total={questions.length}
        />
      </div>

      {myPlayer.finished ? (
        <section className="panel waiting-card waiting-card-center">
          <LoadingSpinner size="lg" />
          <div>
            <h2>{opponentPlayer?.finished ? "結果を集計しています..." : "解答が完了しました"}</h2>
            <p className="subtle-text">
              {opponentPlayer?.finished
                ? "両者の解答を集計しています。結果画面へ移動します。"
                : opponentDisconnected
                  ? "相手は切断中です。再接続されると進行が再開します。"
                  : "相手の完了を待っています。進捗ゲージはリアルタイムで更新されます。"}
            </p>
          </div>
        </section>
      ) : (
        <>
          {question && <QuestionCard question={question} />}

          {question && (
            <div className="players-grid">
              <section className="panel player-panel">
                <div className="player-title">
                  <h2>{myName}</h2>
                  {hasSubmitted ? (
                    <span className={myAnswer?.selectedIndex === question.answer ? "badge correct" : "badge wrong"}>
                      {myAnswer?.selectedIndex === question.answer ? "正解" : "不正解"}
                    </span>
                  ) : (
                    <span className="badge">未回答</span>
                  )}
                </div>
                <ChoiceList
                  answerIndex={question.answer}
                  choiceImages={question.choiceImages}
                  choices={question.choices}
                  disabled={hasSubmitted}
                  revealAnswer={hasSubmitted}
                  selectedIndex={selectedIndex}
                  onSelect={setDraftSelection}
                />
                <div className="button-row">
                  {!hasSubmitted ? (
                    <button
                      className="primary-button"
                      disabled={selectedIndex === null || isSubmitting}
                      type="button"
                      onClick={() => selectedIndex !== null && onSubmitAnswer(selectedIndex)}
                    >
                      {isSubmitting ? "送信中..." : "回答を送信"}
                    </button>
                  ) : (
                    <button className="primary-button" type="button" onClick={onAdvance}>
                      {isLastQuestion ? "解答を完了" : "次の問題へ"}
                    </button>
                  )}
                </div>
                {hasSubmitted && (
                  <div className="answer-panel compact-answer-panel">
                    <strong>正解: {question.answerLabel}</strong>
                    <span>{question.choices[question.answer]}</span>
                  </div>
                )}
              </section>

              <section className="panel player-panel">
                <div className="player-title">
                  <h2>{opponentName}</h2>
                  <span
                    className={`badge ${
                      opponentDisconnected ? "wrong" : opponentPlayer?.finished ? "correct" : ""
                    }`}
                  >
                    {opponentDisconnected
                      ? "切断"
                      : opponentPlayer?.finished
                        ? "完了"
                        : `問${opponentStep}`}
                  </span>
                </div>
                <p className="subtle-text">
                  {opponentDisconnected
                    ? "相手が切断しました。再接続を待っています。"
                    : opponentPlayer?.finished
                      ? "相手は完了しました。あなたは自分のペースで続けられます。"
                      : `相手は現在 ${opponentStep} / ${questions.length} に進んでいます。`}
                </p>
                {opponentPlayer?.finished && (
                  <div className="review-player-answer is-correct">
                    <p>相手は全{questions.length}問の解答を完了しました。</p>
                    <p>あなたが解き終わると、そのまま結果集計へ進みます。</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {actionError && <p className="form-message error-message">{actionError}</p>}

      <div className="button-row">
        <button type="button" onClick={onLeave}>
          退出する
        </button>
      </div>
    </section>
  );
}
