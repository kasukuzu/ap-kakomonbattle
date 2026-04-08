import { useState } from "react";
import { formatFilterLabel } from "../questionData";
import { clearHistory, loadHistory } from "../storage";

type HistoryScreenProps = {
  onBack: () => void;
};

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [history, setHistory] = useState(loadHistory);

  const removeAll = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <section className="screen history-screen">
      <div className="section-heading">
        <p className="eyebrow">履歴</p>
        <h1>対戦結果</h1>
      </div>

      {history.length === 0 ? (
        <div className="panel empty-state">まだ履歴はありません。</div>
      ) : (
        <div className="history-list">
          {history.map((item) => {
            const winnerText =
              item.winner === "draw" ? "引き分け" : `${item[item.winner].name} の勝ち`;
            const mistakeCount = item.questionResults.filter(
              (question) => !question.player1.isCorrect || !question.player2.isCorrect,
            ).length;

            return (
              <article className="panel history-item" key={item.id}>
                <div>
                  <p className="history-date">{new Date(item.playedAt).toLocaleString("ja-JP")}</p>
                  <h2>{winnerText}</h2>
                  <p>
                    {formatFilterLabel(item.settings.year)} / {formatFilterLabel(item.settings.season)} /{" "}
                    {formatFilterLabel(item.settings.category)} / {item.questionIds.length}問
                  </p>
                  <p>復習対象: {mistakeCount}問</p>
                </div>
                <div className="history-scores">
                  <span>
                    {item.player1.name}: {item.player1.correctCount}問 / {item.player1.accuracy}%
                  </span>
                  <span>
                    {item.player2.name}: {item.player2.correctCount}問 / {item.player2.accuracy}%
                  </span>
                </div>
                {item.questionResults.length > 0 && (
                  <details className="history-details">
                    <summary>各問の回答内容を見る</summary>
                    <div className="history-answer-list">
                      {item.questionResults.map((question) => (
                        <div className="history-answer-row" key={`${item.id}-${question.questionId}`}>
                          <strong>
                            {question.examSession ?? "過去データ"} 問
                            {question.questionNumber ?? question.order}
                          </strong>
                          <span>正解: {question.correctAnswerLabel}</span>
                          <span>
                            {item.player1.name}: {question.player1.selectedLabel}
                            {question.player1.isCorrect ? "（正解）" : "（不正解）"}
                          </span>
                          <span>
                            {item.player2.name}: {question.player2.selectedLabel}
                            {question.player2.isCorrect ? "（正解）" : "（不正解）"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="button-row">
        <button type="button" onClick={onBack}>
          トップへ
        </button>
        <button type="button" onClick={removeAll} disabled={history.length === 0}>
          履歴を削除
        </button>
      </div>
    </section>
  );
}
