import { useMemo, useState, type FormEvent } from "react";
import { categories } from "../questionData";
import type { BattleSettings } from "../types";

type SetupScreenProps = {
  defaultSettings: BattleSettings;
  categoryCounts: Record<string, number>;
  onBack: () => void;
  onStart: (settings: BattleSettings) => void;
};

const baseCountOptions = [5, 10, 20, 40, 80];

export function SetupScreen({
  defaultSettings,
  categoryCounts,
  onBack,
  onStart,
}: SetupScreenProps) {
  const [player1Name, setPlayer1Name] = useState(defaultSettings.player1Name);
  const [player2Name, setPlayer2Name] = useState(defaultSettings.player2Name);
  const [category, setCategory] = useState<BattleSettings["category"]>(defaultSettings.category);
  const [questionCount, setQuestionCount] = useState(defaultSettings.questionCount);
  const [questionOrder, setQuestionOrder] = useState<BattleSettings["questionOrder"]>(
    defaultSettings.questionOrder,
  );

  const maxCount = categoryCounts[category] ?? 0;
  const countOptions = useMemo(() => {
    const options = baseCountOptions.filter((count) => count <= maxCount);
    return options.includes(maxCount) ? options : [...options, maxCount].filter(Boolean);
  }, [maxCount]);

  const normalizedCount = Math.min(questionCount, maxCount || questionCount);
  const selectedCount = countOptions.includes(normalizedCount)
    ? normalizedCount
    : countOptions[countOptions.length - 1] ?? 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!maxCount) {
      return;
    }

    onStart({
      player1Name: player1Name.trim() || "プレイヤー1",
      player2Name: player2Name.trim() || "プレイヤー2",
      category,
      questionCount: selectedCount,
      questionOrder,
    });
  };

  return (
    <section className="screen narrow-screen">
      <div className="section-heading">
        <p className="eyebrow">対戦設定</p>
        <h1>プレイヤーと問題を選ぶ</h1>
      </div>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <label>
          プレイヤー1
          <input
            type="text"
            value={player1Name}
            onChange={(event) => setPlayer1Name(event.target.value)}
            maxLength={20}
          />
        </label>

        <label>
          プレイヤー2
          <input
            type="text"
            value={player2Name}
            onChange={(event) => setPlayer2Name(event.target.value)}
            maxLength={20}
          />
        </label>

        <label>
          分野
          <select
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value as BattleSettings["category"];
              setCategory(nextCategory);
              setQuestionCount((current) => Math.min(current, categoryCounts[nextCategory] ?? current));
            }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}（{categoryCounts[item] ?? 0}問）
              </option>
            ))}
          </select>
        </label>

        <label>
          出題数
          <select
            value={selectedCount}
            onChange={(event) => setQuestionCount(Number(event.target.value))}
          >
            {countOptions.map((count) => (
              <option key={count} value={count}>
                {count}問
              </option>
            ))}
          </select>
        </label>

        <fieldset className="segmented-field">
          <legend>出題順</legend>
          <label className="radio-card">
            <input
              checked={questionOrder === "random"}
              name="questionOrder"
              type="radio"
              value="random"
              onChange={() => setQuestionOrder("random")}
            />
            <span>
              ランダム出題
              <small>選んだ分野から毎回シャッフルします。</small>
            </span>
          </label>
          <label className="radio-card">
            <input
              checked={questionOrder === "inOrder"}
              name="questionOrder"
              type="radio"
              value="inOrder"
              onChange={() => setQuestionOrder("inOrder")}
            />
            <span>
              問題番号順
              <small>分野内の問題番号順で出題します。</small>
            </span>
          </label>
        </fieldset>

        <div className="button-row">
          <button className="primary-button" type="submit" disabled={!maxCount}>
            クイズ開始
          </button>
          <button type="button" onClick={onBack}>
            戻る
          </button>
        </div>
      </form>
    </section>
  );
}
