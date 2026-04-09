type ChoiceListProps = {
  choices: string[];
  choiceImages?: Array<string | null>;
  selectedIndex: number | null;
  answerIndex?: number;
  revealAnswer?: boolean;
  disabled?: boolean;
  onSelect?: (choiceIndex: number) => void;
};

const labels = ["ア", "イ", "ウ", "エ"];

export function ChoiceList({
  choices,
  choiceImages,
  selectedIndex,
  answerIndex,
  revealAnswer = false,
  disabled = false,
  onSelect,
}: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map((choice, index) => {
        const selectedClass = selectedIndex === index ? " selected" : "";
        const correctClass = revealAnswer && answerIndex === index ? " correct-choice" : "";
        const wrongClass =
          revealAnswer && selectedIndex === index && selectedIndex !== answerIndex ? " wrong-choice" : "";

        return (
          <button
            className={`choice-button${selectedClass}${correctClass}${wrongClass}`}
            disabled={disabled}
            key={index}
            type="button"
            onClick={() => onSelect?.(index)}
          >
            <span className="choice-label">{labels[index]}</span>
            <span className="choice-content">
              <span>{choice}</span>
              {choiceImages?.[index] && (
                <img
                  className="choice-image"
                  src={choiceImages[index] ?? undefined}
                  alt={`${labels[index]} の選択肢画像`}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
