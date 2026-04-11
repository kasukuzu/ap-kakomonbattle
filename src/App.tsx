import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAnswerMapFromOnlineRoom,
  createBattleResult,
  selectQuestions,
} from "./battle";
import { HistoryScreen } from "./components/HistoryScreen";
import { OnlineCreateRoomScreen } from "./components/OnlineCreateRoomScreen";
import { OnlineJoinRoomScreen } from "./components/OnlineJoinRoomScreen";
import { OnlineMenuScreen } from "./components/OnlineMenuScreen";
import { OnlineQuizScreen } from "./components/OnlineQuizScreen";
import { OnlineRoomScreen } from "./components/OnlineRoomScreen";
import { QuizScreen } from "./components/QuizScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { SetupScreen } from "./components/SetupScreen";
import { TopScreen } from "./components/TopScreen";
import { getQuestionsByIds, questions } from "./questionData";
import { getOnlineFeatureStatus } from "./lib/firebase";
import {
  advanceOnlineQuestion,
  createOnlineRoom,
  finishOnlineRoom,
  leaveOnlineRoom,
  joinOnlineRoom,
  startOnlineRoom,
  submitOnlineAnswer,
  subscribeToOnlineRoom,
} from "./onlineRoom";
import { saveHistory } from "./storage";
import type {
  BattleResult,
  BattleSettings,
  OnlineRoom,
  OnlineSession,
  PlayerKey,
  Question,
} from "./types";

type Screen =
  | "top"
  | "setup"
  | "quiz"
  | "result"
  | "review"
  | "history"
  | "onlineMenu"
  | "onlineCreate"
  | "onlineJoin"
  | "onlineRoom";

const defaultSettings: BattleSettings = {
  player1Name: "プレイヤー1",
  player2Name: "プレイヤー2",
  questionCount: 10,
  year: "令和6",
  season: "秋",
  category: "すべて",
  questionOrder: "random",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "エラーが発生しました。";
}

function App() {
  const [screen, setScreen] = useState<Screen>("top");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<BattleSettings>(defaultSettings);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [localStartedAt, setLocalStartedAt] = useState<number | null>(null);
  const [latestResult, setLatestResult] = useState<BattleResult | null>(null);
  const [reviewReturnScreen, setReviewReturnScreen] = useState<"result" | "onlineRoom">("result");
  const [onlineSession, setOnlineSession] = useState<OnlineSession | null>(null);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState("");
  const [onlineActionError, setOnlineActionError] = useState("");
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [savedOnlineResultId, setSavedOnlineResultId] = useState<string | null>(null);
  const finalizingRoomCodeRef = useRef<string | null>(null);
  const onlineFeature = getOnlineFeatureStatus();

  useEffect(() => {
    if (!onlineSession) {
      setOnlineRoom(null);
      setOnlineLoading(false);
      setOnlineError("");
      return;
    }

    setOnlineLoading(true);
    const unsubscribe = subscribeToOnlineRoom(
      onlineSession.roomCode,
      (room) => {
        setOnlineRoom(room);
        setOnlineLoading(false);
        setOnlineError(room ? "" : "ルームが見つかりません。");
      },
      (message) => {
        setOnlineError(message);
        setOnlineLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [onlineSession]);

  useEffect(() => {
    if (!onlineRoom?.result) {
      finalizingRoomCodeRef.current = null;
      return;
    }

    setLatestResult(onlineRoom.result);
    if (savedOnlineResultId === onlineRoom.result.id) {
      return;
    }

    saveHistory(onlineRoom.result);
    setSavedOnlineResultId(onlineRoom.result.id);
  }, [onlineRoom?.result, savedOnlineResultId]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [screen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const onlineQuestions = useMemo(() => {
    return getQuestionsByIds(onlineRoom?.questionIds ?? []);
  }, [onlineRoom?.questionIds]);

  useEffect(() => {
    if (!onlineRoom || onlineRoom.status !== "playing" || onlineRoom.result || onlineQuestions.length === 0) {
      return;
    }

    const player1Finished = onlineRoom.players.player1?.finished === true;
    const player2Finished = onlineRoom.players.player2?.finished === true;
    if (!player1Finished || !player2Finished) {
      return;
    }

    if (finalizingRoomCodeRef.current === onlineRoom.roomCode) {
      return;
    }

    finalizingRoomCodeRef.current = onlineRoom.roomCode;
    const result = createBattleResult(
      onlineRoom.settings,
      onlineQuestions,
      buildAnswerMapFromOnlineRoom(onlineQuestions, onlineRoom),
      {
        mode: "online",
        roomCode: onlineRoom.roomCode,
        startedAt: onlineRoom.startedAt,
        finishedAt: Date.now(),
      },
    );

    void finishOnlineRoom(onlineRoom.roomCode, result).catch((error) => {
      finalizingRoomCodeRef.current = null;
      setOnlineActionError(getErrorMessage(error));
    });
  }, [onlineQuestions, onlineRoom]);

  const handleNavigate = (nextScreen: Screen) => {
    if (onlineSession && nextScreen !== "onlineRoom") {
      leaveOnlineFlow(nextScreen);
      return;
    }

    setScreen(nextScreen);
  };

  const leaveOnlineFlow = (nextScreen: Screen) => {
    void leaveOnlineRoom(onlineSession);
    setOnlineSession(null);
    setOnlineRoom(null);
    setOnlineLoading(false);
    setOnlineError("");
    setOnlineActionError("");
    setOnlineBusy(false);
    setSavedOnlineResultId(null);
    setScreen(nextScreen);
  };

  const startBattle = (nextSettings: BattleSettings) => {
    const selected = selectQuestions(questions, nextSettings);
    const safeSettings = { ...nextSettings, questionCount: selected.length };
    setSettings(safeSettings);
    setQuizQuestions(selected);
    setLocalStartedAt(Date.now());
    setLatestResult(null);
    setScreen("quiz");
  };

  const finishBattle = (answers: Record<PlayerKey, number[]>) => {
    const result = createBattleResult(settings, quizQuestions, answers, {
      mode: "local",
      startedAt: localStartedAt,
      finishedAt: Date.now(),
    });
    saveHistory(result);
    setLatestResult(result);
    setScreen("result");
  };

  const handleCreateOnlineRoom = async ({
    playerName,
    settings: nextSettings,
  }: {
    playerName: string;
    settings: BattleSettings;
  }) => {
    setOnlineBusy(true);
    setOnlineActionError("");

    try {
      const session = await createOnlineRoom(playerName, nextSettings);
      setSettings(nextSettings);
      setLatestResult(null);
      setSavedOnlineResultId(null);
      setOnlineSession(session);
      setScreen("onlineRoom");
    } catch (error) {
      setOnlineActionError(getErrorMessage(error));
    } finally {
      setOnlineBusy(false);
    }
  };

  const handleJoinOnlineRoom = async ({
    playerName,
    roomCode,
  }: {
    playerName: string;
    roomCode: string;
  }) => {
    setOnlineBusy(true);
    setOnlineActionError("");

    try {
      const session = await joinOnlineRoom(roomCode, playerName);
      setLatestResult(null);
      setSavedOnlineResultId(null);
      setOnlineSession(session);
      setScreen("onlineRoom");
    } catch (error) {
      setOnlineActionError(getErrorMessage(error));
    } finally {
      setOnlineBusy(false);
    }
  };

  const handleStartOnlineBattle = async () => {
    if (!onlineRoom) {
      return;
    }

    setOnlineBusy(true);
    setOnlineActionError("");

    try {
      const selectedQuestions = selectQuestions(questions, onlineRoom.settings);
      if (selectedQuestions.length === 0) {
        throw new Error("選択した条件に一致する問題がありません。");
      }

      const nextSettings = {
        ...onlineRoom.settings,
        questionCount: selectedQuestions.length,
      };
      await startOnlineRoom(onlineRoom.roomCode, nextSettings, selectedQuestions.map((question) => question.id));
    } catch (error) {
      setOnlineActionError(getErrorMessage(error));
    } finally {
      setOnlineBusy(false);
    }
  };

  const handleSubmitOnlineAnswer = async (selectedIndex: number) => {
    if (!onlineSession || !onlineRoom) {
      return;
    }

    const currentPlayer = onlineRoom.players[onlineSession.playerKey];
    const currentQuestion = currentPlayer
      ? onlineQuestions[currentPlayer.currentQuestionIndex]
      : null;
    if (!currentPlayer || !currentQuestion) {
      return;
    }

    setOnlineBusy(true);
    setOnlineActionError("");

    try {
      await submitOnlineAnswer(
        onlineSession,
        currentQuestion.id,
        selectedIndex,
        Math.max(currentPlayer.answeredCount, currentPlayer.currentQuestionIndex + 1),
      );
    } catch (error) {
      setOnlineActionError(getErrorMessage(error));
    } finally {
      setOnlineBusy(false);
    }
  };

  const handleAdvanceOnlineBattle = async () => {
    if (!onlineRoom || !onlineSession) {
      return;
    }

    const currentPlayer = onlineRoom.players[onlineSession.playerKey];
    if (!currentPlayer || currentPlayer.finished) {
      return;
    }

    setOnlineBusy(true);
    setOnlineActionError("");

    try {
      const isLastQuestion = currentPlayer.currentQuestionIndex >= onlineQuestions.length - 1;
      await advanceOnlineQuestion(
        onlineSession,
        isLastQuestion ? onlineQuestions.length : currentPlayer.currentQuestionIndex + 1,
        isLastQuestion,
      );
    } catch (error) {
      setOnlineActionError(getErrorMessage(error));
    } finally {
      setOnlineBusy(false);
    }
  };

  const openReview = (source: "result" | "onlineRoom", result: BattleResult) => {
    setLatestResult(result);
    setReviewReturnScreen(source);
    setScreen("review");
  };

  const navigationItems: Array<{ screen: Screen; label: string }> = [
    { screen: "setup", label: "ローカル対戦" },
    { screen: "onlineMenu", label: "オンライン対戦" },
    { screen: "history", label: "履歴" },
  ];

  const navigateFromMenu = (nextScreen: Screen) => {
    setIsMobileMenuOpen(false);
    handleNavigate(nextScreen);
  };

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => navigateFromMenu("top")}>
          応用情報 過去問バトル
        </button>
        <nav className="header-nav" aria-label="画面切り替え">
          <div className="header-actions desktop-nav">
            {navigationItems.map((item) => (
              <button key={item.screen} type="button" onClick={() => handleNavigate(item.screen)}>
                {item.label}
              </button>
            ))}
          </div>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            className={`menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <div
            aria-hidden={!isMobileMenuOpen}
            className={`mobile-menu-overlay${isMobileMenuOpen ? " is-open" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div
            className={`mobile-menu${isMobileMenuOpen ? " is-open" : ""}`}
            id="mobile-navigation"
            role="menu"
          >
            <div className="mobile-menu-actions">
              {navigationItems.map((item) => (
                <button
                  key={item.screen}
                  className="mobile-menu-button"
                  role="menuitem"
                  type="button"
                  onClick={() => navigateFromMenu(item.screen)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main>
        {screen === "top" && (
          <TopScreen
            onHistory={() => handleNavigate("history")}
            onLocalStart={() => handleNavigate("setup")}
            onOnlineStart={() => handleNavigate("onlineMenu")}
          />
        )}
        {screen === "setup" && (
          <SetupScreen
            defaultSettings={settings}
            onBack={() => setScreen("top")}
            onStart={startBattle}
          />
        )}
        {screen === "quiz" && (
          <QuizScreen
            questions={quizQuestions}
            settings={settings}
            startedAt={localStartedAt}
            onCancel={() => setScreen("setup")}
            onFinish={finishBattle}
          />
        )}
        {screen === "result" && latestResult && (
          <ResultScreen
            result={latestResult}
            onHistory={() => setScreen("history")}
            onRestart={() => setScreen("setup")}
            onReviewMistakes={() => openReview("result", latestResult)}
            onTop={() => setScreen("top")}
          />
        )}
        {screen === "review" && latestResult && (
          <ReviewScreen result={latestResult} onBack={() => setScreen(reviewReturnScreen)} />
        )}
        {screen === "history" && <HistoryScreen onBack={() => setScreen("top")} />}
        {screen === "onlineMenu" && (
          <OnlineMenuScreen
            onBack={() => setScreen("top")}
            onCreateRoom={() => setScreen("onlineCreate")}
            onJoinRoom={() => setScreen("onlineJoin")}
          />
        )}
        {screen === "onlineCreate" && (
          <OnlineCreateRoomScreen
            availabilityMessage={onlineFeature.message}
            defaultPlayerName={settings.player1Name}
            defaultSettings={settings}
            errorMessage={onlineActionError}
            isSubmitting={onlineBusy}
            onBack={() => setScreen("onlineMenu")}
            onCreate={handleCreateOnlineRoom}
          />
        )}
        {screen === "onlineJoin" && (
          <OnlineJoinRoomScreen
            availabilityMessage={onlineFeature.message}
            defaultPlayerName={settings.player2Name}
            errorMessage={onlineActionError}
            isSubmitting={onlineBusy}
            onBack={() => setScreen("onlineMenu")}
            onJoin={handleJoinOnlineRoom}
          />
        )}
        {screen === "onlineRoom" && onlineSession && (
          <>
            {onlineRoom?.status === "playing" ? (
              <OnlineQuizScreen
                actionError={onlineActionError}
                isSubmitting={onlineBusy}
                questions={onlineQuestions}
                room={onlineRoom}
                session={onlineSession}
                onAdvance={handleAdvanceOnlineBattle}
                onLeave={() => leaveOnlineFlow("onlineMenu")}
                onSubmitAnswer={handleSubmitOnlineAnswer}
              />
            ) : onlineRoom?.status === "finished" && onlineRoom.result ? (
              <ResultScreen
                restartLabel="オンライン対戦へ戻る"
                result={onlineRoom.result}
                onHistory={() => leaveOnlineFlow("history")}
                onRestart={() => leaveOnlineFlow("onlineMenu")}
                onReviewMistakes={() => openReview("onlineRoom", onlineRoom.result!)}
                onTop={() => leaveOnlineFlow("top")}
              />
            ) : (
              <OnlineRoomScreen
                actionError={onlineActionError}
                errorMessage={onlineError}
                isLoading={onlineLoading}
                isStarting={onlineBusy}
                room={onlineRoom}
                session={onlineSession}
                onBack={() => leaveOnlineFlow("onlineMenu")}
                onStart={handleStartOnlineBattle}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
