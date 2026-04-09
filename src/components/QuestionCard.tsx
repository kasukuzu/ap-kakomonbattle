import type { Question } from "../types";
import { QuestionAssets } from "./QuestionAssets";

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
      <QuestionAssets
        answerAreaImage={question.answerAreaImage}
        questionId={question.id}
        questionImage={question.questionImage}
      />
    </article>
  );
}
