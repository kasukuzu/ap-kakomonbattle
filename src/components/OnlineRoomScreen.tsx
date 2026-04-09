import { formatFilterLabel } from "../questionData";
import type { OnlineRoom, OnlineSession, PlayerKey } from "../types";

type OnlineRoomScreenProps = {
  room: OnlineRoom | null;
  session: OnlineSession;
  isLoading: boolean;
  errorMessage: string;
  actionError: string;
  isStarting: boolean;
  onBack: () => void;
  onStart: () => void;
};

function getStatusLabel(status: OnlineRoom["status"]) {
  switch (status) {
    case "ready":
      return "準備完了";
    case "playing":
      return "対戦中";
    case "finished":
      return "終了";
    default:
      return "待機中";
  }
}

function getOpponentKey(playerKey: PlayerKey): PlayerKey {
  return playerKey === "player1" ? "player2" : "player1";
}

export function OnlineRoomScreen({
  room,
  session,
  isLoading,
  errorMessage,
  actionError,
  isStarting,
  onBack,
  onStart,
}: OnlineRoomScreenProps) {
  if (isLoading) {
    return (
      <section className="screen narrow-screen">
        <div className="panel empty-state">ルーム情報を読み込み中です...</div>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="screen narrow-screen">
        <div className="panel empty-state">{errorMessage || "ルームが見つかりません。"}</div>
        <div className="button-row">
          <button type="button" onClick={onBack}>
            戻る
          </button>
        </div>
      </section>
    );
  }

  const canStart =
    session.playerKey === "player1" &&
    room.status !== "playing" &&
    room.status !== "finished" &&
    room.players.player1?.connected &&
    room.players.player2?.connected;
  const opponentKey = getOpponentKey(session.playerKey);
  const opponentDisconnected = Boolean(room.players[opponentKey] && room.players[opponentKey]?.connected === false);

  return (
    <section className="screen room-screen">
      <div className="section-heading">
        <p className="eyebrow">オンライン対戦</p>
        <h1>ルームコード {room.roomCode}</h1>
      </div>

      <div className="room-layout">
        <article className="panel room-summary">
          <div className="question-meta">
            <span>{getStatusLabel(room.status)}</span>
            <span>{formatFilterLabel(room.settings.year)}</span>
            <span>{formatFilterLabel(room.settings.season)}</span>
            <span>{formatFilterLabel(room.settings.category)}</span>
            <span>{room.settings.questionCount}問</span>
          </div>
          <p className="subtle-text">
            出題順: {room.settings.questionOrder === "random" ? "ランダム" : "問題番号順"}
          </p>
          <p className="subtle-text">
            ホストが開始すると、同じ問題セットで対戦が始まります。
          </p>
          {opponentDisconnected && (
            <p className="form-message error-message">相手が切断しました。再接続を待っています。</p>
          )}
          {actionError && <p className="form-message error-message">{actionError}</p>}
          {errorMessage && <p className="form-message error-message">{errorMessage}</p>}
          <div className="button-row">
            {session.playerKey === "player1" ? (
              <button
                className="primary-button"
                disabled={!canStart || isStarting}
                type="button"
                onClick={onStart}
              >
                {isStarting ? "開始中..." : "対戦を開始"}
              </button>
            ) : (
              <button disabled type="button">
                ホストの開始を待っています
              </button>
            )}
            <button type="button" onClick={onBack}>
              退出する
            </button>
          </div>
        </article>

        <div className="players-grid">
          <PlayerStatusCard
            label="プレイヤー1"
            player={room.players.player1}
            isMe={session.playerKey === "player1"}
          />
          <PlayerStatusCard
            label="プレイヤー2"
            player={room.players.player2}
            isMe={session.playerKey === "player2"}
          />
        </div>
      </div>
    </section>
  );
}

type PlayerStatusCardProps = {
  label: string;
  player?: OnlineRoom["players"][PlayerKey];
  isMe: boolean;
};

function PlayerStatusCard({ label, player, isMe }: PlayerStatusCardProps) {
  return (
    <section className="panel player-panel">
      <div className="player-title">
        <h2>{player?.name ?? `${label} 参加待ち`}</h2>
        <span className={`badge ${player?.connected === false ? "wrong" : "correct"}`}>
          {player ? (player.connected === false ? "切断" : "接続中") : "未参加"}
        </span>
      </div>
      <p className="subtle-text">{isMe ? "あなた" : label}</p>
      {player?.lastSeenAt && <p className="subtle-text">最終更新: {new Date(player.lastSeenAt).toLocaleTimeString("ja-JP")}</p>}
    </section>
  );
}
