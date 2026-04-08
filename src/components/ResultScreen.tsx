import type { BattleResult } from "../types";
import { formatFilterLabel } from "../questionData";

type ResultScreenProps = {
  result: BattleResult;
  onRestart: () => void;
  onReviewMistakes: () => void;
  onHistory: () => void;
  onTop: () => void;
};

export function ResultScreen({
  result,
  onRestart,
  onReviewMistakes,
  onHistory,
  onTop,
}: ResultScreenProps) {
  const questionCount = result.questionIds.length;
  const mistakeCount = result.questionResults.filter(
    (item) => !item.player1.isCorrect || !item.player2.isCorrect,
  ).length;
  const winnerText =
    result.winner === "draw"
      ? "引き分け"
      : `${result[result.winner].name} の勝ち`;

  return (
    <section className="screen narrow-screen">
      <div className="section-heading">
        <p className="eyebrow">結果</p>
        <h1>{winnerText}</h1>
      </div>

      <div className="result-grid">
        <ResultCard
          accuracy={result.player1.accuracy}
          correctCount={result.player1.correctCount}
          isWinner={result.winner === "player1"}
          name={result.player1.name}
          questionCount={questionCount}
        />
        <ResultCard
          accuracy={result.player2.accuracy}
          correctCount={result.player2.correctCount}
          isWinner={result.winner === "player2"}
          name={result.player2.name}
          questionCount={questionCount}
        />
      </div>

      <div className="panel result-summary">
        <span>年度: {formatFilterLabel(result.settings.year)}</span>
        <span>期: {formatFilterLabel(result.settings.season)}</span>
        <span>分野: {formatFilterLabel(result.settings.category)}</span>
        <span>出題数: {questionCount}問</span>
        <span>出題順: {result.settings.questionOrder === "random" ? "ランダム" : "問題番号順"}</span>
        <span>復習対象: {mistakeCount}問</span>
        <span>保存日時: {new Date(result.playedAt).toLocaleString("ja-JP")}</span>
      </div>

      <div className="button-row">
        <button type="button" onClick={onReviewMistakes} disabled={mistakeCount === 0}>
          間違えた問題だけ復習
        </button>
        <button className="primary-button" type="button" onClick={onRestart}>
          もう一度
        </button>
        <button type="button" onClick={onHistory}>
          履歴へ
        </button>
        <button type="button" onClick={onTop}>
          トップへ
        </button>
      </div>
    </section>
  );
}

type ResultCardProps = {
  name: string;
  correctCount: number;
  questionCount: number;
  accuracy: number;
  isWinner: boolean;
};

function ResultCard({ name, correctCount, questionCount, accuracy, isWinner }: ResultCardProps) {
  return (
    <section className={`panel result-card${isWinner ? " winner-card" : ""}`}>
      <div className="player-title">
        <h2>{name}</h2>
        {isWinner && <span className="badge correct">勝ち</span>}
      </div>
      <p className="score-large">
        {correctCount}
        <span> / {questionCount}問</span>
      </p>
      <div className="accuracy-meter" aria-label={`${name} の正答率 ${accuracy}%`}>
        <span style={{ width: `${accuracy}%` }} />
      </div>
      <p className="accuracy">{accuracy}%</p>
    </section>
  );
}
