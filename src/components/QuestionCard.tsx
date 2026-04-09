import type { Question } from "../types";

type QuestionCardProps = {
  question: Question;
};

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <article className="panel question-panel">
      <div className="question-meta">
        <span>{question.category}</span>
        <span>{question.examSession}</span>
        <span>問{question.questionNumber}</span>
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
  );
}
