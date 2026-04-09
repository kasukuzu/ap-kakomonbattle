type QuestionAssetsProps = {
  questionId: string;
  questionImage?: string;
  answerAreaImage?: string;
};

export function QuestionAssets({
  questionId,
  questionImage,
  answerAreaImage,
}: QuestionAssetsProps) {
  if (!questionImage && !answerAreaImage) {
    return null;
  }

  return (
    <div className="question-assets">
      {questionImage && (
        <figure className="question-asset">
          <img
            className="question-asset-image"
            src={questionImage}
            alt={`${questionId} の問題図表`}
          />
          <figcaption className="question-asset-caption">問題図表</figcaption>
        </figure>
      )}
      {answerAreaImage && (
        <figure className="question-asset">
          <img
            className="question-asset-image"
            src={answerAreaImage}
            alt={`${questionId} の図付き選択肢または解答欄`}
          />
          <figcaption className="question-asset-caption">
            図付き選択肢・解答欄
          </figcaption>
        </figure>
      )}
    </div>
  );
}
