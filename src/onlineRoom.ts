import { get, onDisconnect, onValue, ref, runTransaction, update } from "firebase/database";
import { ensureSignedInAnonymously, getFirebaseDatabase, getOnlineFeatureStatus } from "./lib/firebase";
import type {
  BattleResult,
  BattleSettings,
  OnlineRoom,
  OnlineRoomAnswer,
  OnlineRoomPlayer,
  OnlineRoomStatus,
  OnlineSession,
  PlayerKey,
} from "./types";

let presenceCleanup: (() => void) | null = null;

function roomPath(roomCode: string) {
  return `rooms/${roomCode}`;
}

function requireDatabase() {
  const database = getFirebaseDatabase();
  if (!database) {
    throw new Error(getOnlineFeatureStatus().message);
  }
  return database;
}

function normalizeSettings(value: unknown): BattleSettings {
  const settings = value && typeof value === "object" ? (value as Partial<BattleSettings>) : {};

  return {
    player1Name: typeof settings.player1Name === "string" ? settings.player1Name : "プレイヤー1",
    player2Name: typeof settings.player2Name === "string" ? settings.player2Name : "プレイヤー2",
    questionCount: typeof settings.questionCount === "number" ? settings.questionCount : 10,
    year: settings.year ?? "すべて",
    season: settings.season ?? "すべて",
    category: settings.category ?? "すべて",
    questionOrder: settings.questionOrder === "inOrder" ? "inOrder" : "random",
  };
}

function normalizePlayer(value: unknown): OnlineRoomPlayer | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const player = value as Partial<OnlineRoomPlayer>;
  if (typeof player.uid !== "string" || typeof player.name !== "string") {
    return undefined;
  }

  return {
    uid: player.uid,
    name: player.name,
    connected: player.connected !== false,
    joinedAt: typeof player.joinedAt === "number" ? player.joinedAt : Date.now(),
    lastSeenAt: typeof player.lastSeenAt === "number" ? player.lastSeenAt : null,
  };
}

function normalizeAnswers(value: unknown): OnlineRoom["answers"] {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<OnlineRoom["answers"]>(
    (result, [questionId, players]) => {
      if (!players || typeof players !== "object") {
        return result;
      }

      const playerAnswers = Object.entries(players as Record<string, unknown>).reduce<
        Partial<Record<PlayerKey, OnlineRoomAnswer>>
      >((answerResult, [playerKey, answer]) => {
        if ((playerKey !== "player1" && playerKey !== "player2") || !answer || typeof answer !== "object") {
          return answerResult;
        }

        const parsedAnswer = answer as Partial<OnlineRoomAnswer>;
        if (typeof parsedAnswer.selectedIndex !== "number") {
          return answerResult;
        }

        answerResult[playerKey] = {
          selectedIndex: parsedAnswer.selectedIndex,
          answeredAt: typeof parsedAnswer.answeredAt === "number" ? parsedAnswer.answeredAt : Date.now(),
        };
        return answerResult;
      }, {});

      result[questionId] = playerAnswers;
      return result;
    },
    {},
  );
}

function normalizeRoom(roomCode: string, value: unknown): OnlineRoom | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const room = value as Record<string, unknown>;
  const rawPlayers = room.players && typeof room.players === "object"
    ? (room.players as Record<string, unknown>)
    : {};
  const status =
    room.status === "waiting" ||
    room.status === "ready" ||
    room.status === "playing" ||
    room.status === "finished"
      ? (room.status as OnlineRoomStatus)
      : "waiting";

  return {
    roomCode,
    status,
    createdAt: typeof room.createdAt === "number" ? room.createdAt : Date.now(),
    startedAt: typeof room.startedAt === "number" ? room.startedAt : null,
    finishedAt: typeof room.finishedAt === "number" ? room.finishedAt : null,
    settings: normalizeSettings(room.settings),
    players: {
      player1: normalizePlayer(rawPlayers.player1),
      player2: normalizePlayer(rawPlayers.player2),
    },
    questionIds: Array.isArray(room.questionIds)
      ? room.questionIds.filter((id): id is string => typeof id === "string")
      : [],
    currentQuestionIndex:
      typeof room.currentQuestionIndex === "number" ? room.currentQuestionIndex : 0,
    answers: normalizeAnswers(room.answers),
    result: room.result && typeof room.result === "object" ? (room.result as BattleResult) : null,
  };
}

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalizeRoomCode(input: string) {
  return input.replace(/\D/g, "").slice(0, 4);
}

async function bindPresence(roomCode: string, playerKey: PlayerKey) {
  clearPresenceBinding();

  const database = requireDatabase();
  const playerRef = ref(database, `${roomPath(roomCode)}/players/${playerKey}`);
  const connectedRef = ref(database, ".info/connected");
  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    if (snapshot.val() !== true) {
      return;
    }

    try {
      await onDisconnect(playerRef).update({ connected: false });
      await update(playerRef, { connected: true, lastSeenAt: Date.now() });
    } catch {
      // Presence update failures are surfaced in the room UI through stale connection state.
    }
  });

  presenceCleanup = () => {
    unsubscribe();
  };
}

export function clearPresenceBinding() {
  if (presenceCleanup) {
    presenceCleanup();
    presenceCleanup = null;
  }
}

export async function createOnlineRoom(
  playerName: string,
  settings: BattleSettings,
): Promise<OnlineSession> {
  const database = requireDatabase();
  const user = await ensureSignedInAnonymously();
  const safeName = playerName.trim() || "プレイヤー1";

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const roomCode = generateRoomCode();
    const transaction = await runTransaction(ref(database, roomPath(roomCode)), (currentRoom) => {
      if (currentRoom !== null) {
        return;
      }

      return {
        roomCode,
        status: "waiting",
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null,
        settings: {
          ...settings,
          player1Name: safeName,
          player2Name: "参加待ち",
        },
        players: {
          player1: {
            uid: user.uid,
            name: safeName,
            connected: true,
            joinedAt: Date.now(),
            lastSeenAt: Date.now(),
          },
        },
        questionIds: [],
        currentQuestionIndex: 0,
        answers: {},
        result: null,
      };
    });

    if (transaction.committed) {
      await bindPresence(roomCode, "player1");
      return {
        roomCode,
        playerKey: "player1",
        uid: user.uid,
      };
    }
  }

  throw new Error("4桁ルームコードの生成に失敗しました。時間を置いて再度お試しください。");
}

export async function joinOnlineRoom(roomCodeInput: string, playerName: string): Promise<OnlineSession> {
  const database = requireDatabase();
  const user = await ensureSignedInAnonymously();
  const roomCode = normalizeRoomCode(roomCodeInput);
  const safeName = playerName.trim() || "プレイヤー2";

  if (roomCode.length !== 4) {
    throw new Error("4桁のルームコードを入力してください。");
  }

  const roomRef = ref(database, roomPath(roomCode));
  const snapshot = await get(roomRef);
  const room = normalizeRoom(roomCode, snapshot.val());

  if (!room) {
    throw new Error("指定したルームが見つかりません。");
  }

  if (room.status === "playing") {
    throw new Error("このルームは既に対戦中です。");
  }

  if (room.status === "finished") {
    throw new Error("このルームは既に終了しています。");
  }

  if (room.players.player2 && room.players.player2.uid !== user.uid) {
    throw new Error("このルームは既に満員です。");
  }

  const transaction = await runTransaction(roomRef, (currentRoom) => {
    if (!currentRoom || typeof currentRoom !== "object") {
      return currentRoom;
    }

    const current = currentRoom as Record<string, unknown>;
    const players =
      current.players && typeof current.players === "object"
        ? (current.players as Record<string, unknown>)
        : {};
    const existingPlayer2 =
      players.player2 && typeof players.player2 === "object"
        ? (players.player2 as Record<string, unknown>)
        : null;

    if (existingPlayer2 && typeof existingPlayer2.uid === "string" && existingPlayer2.uid !== user.uid) {
      return;
    }

    return {
      ...current,
      status: "ready",
      settings: {
        ...normalizeSettings(current.settings),
        player2Name: safeName,
      },
      players: {
        ...players,
        player2: {
          uid: user.uid,
          name: safeName,
          connected: true,
          joinedAt: existingPlayer2 && typeof existingPlayer2.joinedAt === "number"
            ? existingPlayer2.joinedAt
            : Date.now(),
          lastSeenAt: Date.now(),
        },
      },
    };
  });

  if (!transaction.committed) {
    throw new Error("このルームには参加できませんでした。");
  }

  await bindPresence(roomCode, "player2");
  return {
    roomCode,
    playerKey: "player2",
    uid: user.uid,
  };
}

export function subscribeToOnlineRoom(
  roomCodeInput: string,
  onRoomChange: (room: OnlineRoom | null) => void,
  onError: (message: string) => void,
) {
  const database = getFirebaseDatabase();
  const roomCode = normalizeRoomCode(roomCodeInput);
  if (!database) {
    onError(getOnlineFeatureStatus().message);
    return () => undefined;
  }

  return onValue(
    ref(database, roomPath(roomCode)),
    (snapshot) => {
      onRoomChange(normalizeRoom(roomCode, snapshot.val()));
    },
    () => {
      onError("ルーム情報の同期に失敗しました。再読み込みして再接続してください。");
    },
  );
}

export async function startOnlineRoom(
  roomCodeInput: string,
  settings: BattleSettings,
  questionIds: string[],
) {
  const database = requireDatabase();
  const roomCode = normalizeRoomCode(roomCodeInput);

  await update(ref(database, roomPath(roomCode)), {
    status: "playing",
    startedAt: Date.now(),
    finishedAt: null,
    settings,
    questionIds,
    currentQuestionIndex: 0,
    answers: {},
    result: null,
  });
}

export async function submitOnlineAnswer(
  session: OnlineSession,
  questionId: string,
  selectedIndex: number,
) {
  const database = requireDatabase();

  await update(ref(database, `${roomPath(session.roomCode)}/answers/${questionId}/${session.playerKey}`), {
    selectedIndex,
    answeredAt: Date.now(),
  });
}

export async function advanceOnlineQuestion(roomCodeInput: string, nextIndex: number) {
  const database = requireDatabase();
  const roomCode = normalizeRoomCode(roomCodeInput);

  await update(ref(database, roomPath(roomCode)), {
    currentQuestionIndex: nextIndex,
  });
}

export async function finishOnlineRoom(roomCodeInput: string, result: BattleResult) {
  const database = requireDatabase();
  const roomCode = normalizeRoomCode(roomCodeInput);

  await update(ref(database, roomPath(roomCode)), {
    status: "finished",
    finishedAt: result.finishedAt ?? Date.now(),
    result,
  });
}

export async function leaveOnlineRoom(session: OnlineSession | null) {
  clearPresenceBinding();

  if (!session) {
    return;
  }

  const database = getFirebaseDatabase();
  if (!database) {
    return;
  }

  await update(ref(database, `${roomPath(session.roomCode)}/players/${session.playerKey}`), {
    connected: false,
    lastSeenAt: Date.now(),
  });
}
