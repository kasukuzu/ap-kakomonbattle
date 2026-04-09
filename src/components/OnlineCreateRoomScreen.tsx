import { useMemo, useState, type FormEvent } from "react";
import {
  categories,
  filterQuestions,
  formatFilterLabel,
  questions,
  seasonOptions,
  yearOptions,
} from "../questionData";
import type { BattleSettings } from "../types";

type OnlineCreateRoomScreenProps = {
  defaultSettings: BattleSettings;
  defaultPlayerName: string;
  isSubmitting: boolean;
  errorMessage: string;
  availabilityMessage: string;
  onBack: () => void;
  onCreate: (input: { playerName: string; settings: BattleSettings }) => void;
};

const baseCountOptions = [5, 10, 20, 40, 80];

export function OnlineCreateRoomScreen({
  defaultSettings,
  defaultPlayerName,
  isSubmitting,
  errorMessage,
  availabilityMessage,
  onBack,
  onCreate,
}: OnlineCreateRoomScreenProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [year, setYear] = useState<BattleSettings["year"]>(defaultSettings.year);
  const [season, setSeason] = useState<BattleSettings["season"]>(defaultSettings.season);
  const [category, setCategory] = useState<BattleSettings["category"]>(defaultSettings.category);
  const [questionCount, setQuestionCount] = useState(defaultSettings.questionCount);
  const [questionOrder, setQuestionOrder] = useState<BattleSettings["questionOrder"]>(
    defaultSettings.questionOrder,
  );

  const maxCount = useMemo(() => {
    return filterQuestions(questions, { year, season, category }).length;
  }, [category, season, year]);

  const countOptions = useMemo(() => {
    const options = baseCountOptions.filter((count) => count <= maxCount);
    return options.includes(maxCount) ? options : [...options, maxCount].filter(Boolean);
  }, [maxCount]);

  const normalizedCount = Math.min(questionCount, maxCount || questionCount);
  const selectedCount = countOptions.includes(normalizedCount)
    ? normalizedCount
    : countOptions[countOptions.length - 1] ?? 0;
  const hasNoQuestions = maxCount === 0;
  const isCountAdjusted = maxCount > 0 && questionCount > maxCount;

  const getCount = (filters: Partial<Pick<BattleSettings, "year" | "season" | "category">>) => {
    return filterQuestions(questions, {
      year: filters.year ?? year,
      season: filters.season ?? season,
      category: filters.category ?? category,
    }).length;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!maxCount || availabilityMessage) {
      return;
    }

    onCreate({
      playerName: playerName.trim() || "プレイヤー1",
      settings: {
        player1Name: playerName.trim() || "プレイヤー1",
        player2Name: "参加待ち",
        year,
        season,
        category,
        questionCount: selectedCount,
        questionOrder,
      },
    });
  };

  return (
    <section className="screen narrow-screen">
      <div className="section-heading">
        <p className="eyebrow">オンライン対戦</p>
        <h1>ルームを作成する</h1>
      </div>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <label>
          あなたの名前
          <input
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={20}
          />
        </label>

        <label>
          年度
          <select value={year} onChange={(event) => setYear(event.target.value as BattleSettings["year"])}>
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {formatFilterLabel(item)}（{getCount({ year: item })}問）
              </option>
            ))}
          </select>
        </label>

        <label>
          期
          <select
            value={season}
            onChange={(event) => setSeason(event.target.value as BattleSettings["season"])}
          >
            {seasonOptions.map((item) => (
              <option key={item} value={item}>
                {formatFilterLabel(item)}（{getCount({ season: item })}問）
              </option>
            ))}
          </select>
        </label>

        <label>
          分野
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as BattleSettings["category"])}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {formatFilterLabel(item)}（{getCount({ category: item })}問）
              </option>
            ))}
          </select>
        </label>

        <label>
          出題数
          <select value={selectedCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
            {countOptions.length === 0 ? (
              <option value={0}>問題なし</option>
            ) : (
              countOptions.map((count) => (
                <option key={count} value={count}>
                  {count}問
                </option>
              ))
            )}
          </select>
        </label>

        <fieldset className="segmented-field">
          <legend>出題順</legend>
          <label className="radio-card">
            <input
              checked={questionOrder === "random"}
              name="onlineQuestionOrder"
              type="radio"
              onChange={() => setQuestionOrder("random")}
            />
            <span>
              ランダム出題
              <small>条件に一致した問題から毎回シャッフルします。</small>
            </span>
          </label>
          <label className="radio-card">
            <input
              checked={questionOrder === "inOrder"}
              name="onlineQuestionOrder"
              type="radio"
              onChange={() => setQuestionOrder("inOrder")}
            />
            <span>
              問題番号順
              <small>年度・期・問番号順で出題します。</small>
            </span>
          </label>
        </fieldset>

        {availabilityMessage && <p className="form-message error-message">{availabilityMessage}</p>}
        {hasNoQuestions && (
          <p className="form-message error-message">
            選択した条件に一致する問題がありません。年度、期、分野を見直してください。
          </p>
        )}
        {isCountAdjusted && (
          <p className="form-message">
            選択条件では {maxCount} 問まで出題できます。出題数は {selectedCount} 問に調整されます。
          </p>
        )}
        {errorMessage && <p className="form-message error-message">{errorMessage}</p>}

        <div className="button-row">
          <button
            className="primary-button"
            disabled={hasNoQuestions || Boolean(availabilityMessage) || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "ルーム作成中..." : "ルームを作成"}
          </button>
          <button type="button" onClick={onBack}>
            戻る
          </button>
        </div>
      </form>
    </section>
  );
}
