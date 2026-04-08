import type { BattleResult, PlayerQuestionAnswer } from "../types";

type ReviewScreenProps = {
  result: BattleResult;
  onBack: () => void;
};

export function ReviewScreen({ result, onBack }: ReviewScreenProps) {
  const mistakes = result.questionResults.filter(
    (item) => !item.player1.isCorrect || !item.player2.isCorrect,
  );

  return (
    <section className="screen review-screen">
      <div className="section-heading">
        <p className="eyebrow">復習</p>
        <h1>間違えた問題だけ復習</h1>
        <p className="subtle-text">
          どちらかが間違えた問題を {mistakes.length} 問表示しています。
        </p>
      </div>

      {mistakes.length === 0 ? (
        <div className="panel empty-state">復習対象の問題はありません。</div>
      ) : (
        <div className="review-list">
          {mistakes.map((item) => (
            <article className="panel review-item" key={`${result.id}-${item.questionId}`}>
              <div className="question-meta">
                <span>{item.examSession}</span>
                <span>問{item.questionNumber}</span>
                <span>{item.category}</span>
              </div>
              <p className="question-text">{item.question}</p>
              {item.questionImage && (
                <img
                  className="question-image"
                  src={item.questionImage}
                  alt={`${item.questionId} の問題画像`}
                />
              )}
              <div className="review-answer-block">
                <strong>正解: {item.correctAnswerLabel}</strong>
                <span>{item.correctAnswerText}</span>
                {item.correctAnswerImage && (
                  <img
                    className="choice-image"
                    src={item.correctAnswerImage}
                    alt={`${item.correctAnswerLabel} の正解画像`}
                  />
                )}
              </div>
              <div className="review-players">
                <ReviewPlayerAnswer name={result.player1.name} answer={item.player1} />
                <ReviewPlayerAnswer name={result.player2.name} answer={item.player2} />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="button-row">
        <button className="primary-button" type="button" onClick={onBack}>
          結果へ戻る
        </button>
      </div>
    </section>
  );
}

type ReviewPlayerAnswerProps = {
  name: string;
  answer: PlayerQuestionAnswer;
};

function ReviewPlayerAnswer({ name, answer }: ReviewPlayerAnswerProps) {
  return (
    <div className={`review-player-answer ${answer.isCorrect ? "is-correct" : "is-wrong"}`}>
      <div className="player-title compact-title">
        <h2>{name}</h2>
        <span className={answer.isCorrect ? "badge correct" : "badge wrong"}>
          {answer.isCorrect ? "正解" : "不正解"}
        </span>
      </div>
      <p>
        {answer.selectedLabel}: {answer.selectedText}
      </p>
      {answer.selectedImage && (
        <img
          className="choice-image"
          src={answer.selectedImage}
          alt={`${name} の選択画像`}
        />
      )}
    </div>
  );
}
