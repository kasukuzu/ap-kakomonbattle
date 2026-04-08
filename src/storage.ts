import type { BattleResult } from "./types";

const STORAGE_KEY = "ap-kakomon-battle-history";

export function loadHistory(): BattleResult[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeResult) : [];
  } catch {
    return [];
  }
}

function normalizeResult(result: BattleResult): BattleResult {
  return {
    ...result,
    questionResults: Array.isArray(result.questionResults) ? result.questionResults : [],
    settings: {
      ...result.settings,
      year: result.settings.year ?? "すべて",
      season: result.settings.season ?? "すべて",
      questionOrder: result.settings.questionOrder ?? "random",
    },
  };
}

export function saveHistory(result: BattleResult): void {
  const history = loadHistory();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([result, ...history]));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
