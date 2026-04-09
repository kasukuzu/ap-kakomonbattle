import { useState, type FormEvent } from "react";

type OnlineJoinRoomScreenProps = {
  defaultPlayerName: string;
  isSubmitting: boolean;
  errorMessage: string;
  availabilityMessage: string;
  onBack: () => void;
  onJoin: (input: { playerName: string; roomCode: string }) => void;
};

export function OnlineJoinRoomScreen({
  defaultPlayerName,
  isSubmitting,
  errorMessage,
  availabilityMessage,
  onBack,
  onJoin,
}: OnlineJoinRoomScreenProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (availabilityMessage) {
      return;
    }

    onJoin({
      playerName: playerName.trim() || "プレイヤー2",
      roomCode,
    });
  };

  return (
    <section className="screen narrow-screen">
      <div className="section-heading">
        <p className="eyebrow">オンライン対戦</p>
        <h1>ルームに参加する</h1>
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
          4桁ルームコード
          <input
            inputMode="numeric"
            maxLength={4}
            pattern="\d{4}"
            placeholder="1234"
            type="text"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>

        {availabilityMessage && <p className="form-message error-message">{availabilityMessage}</p>}
        {errorMessage && <p className="form-message error-message">{errorMessage}</p>}

        <div className="button-row">
          <button
            className="primary-button"
            disabled={roomCode.length !== 4 || Boolean(availabilityMessage) || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "参加中..." : "ルームに参加"}
          </button>
          <button type="button" onClick={onBack}>
            戻る
          </button>
        </div>
      </form>
    </section>
  );
}
