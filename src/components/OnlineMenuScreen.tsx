type OnlineMenuScreenProps = {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBack: () => void;
};

export function OnlineMenuScreen({
  onCreateRoom,
  onJoinRoom,
  onBack,
}: OnlineMenuScreenProps) {
  return (
    <section className="screen narrow-screen">
      <div className="section-heading">
        <p className="eyebrow">オンライン対戦</p>
        <h1>4桁コードでルームを作成・参加</h1>
        <p className="subtle-text">
          ホストがルームを作成し、参加側が同じ4桁コードを入力して合流します。
        </p>
      </div>

      <div className="online-menu-grid">
        <article className="panel menu-card">
          <h2>ルーム作成</h2>
          <p className="subtle-text">出題条件を決めて、4桁コードを発行します。</p>
          <button className="primary-button" type="button" onClick={onCreateRoom}>
            ルームを作成
          </button>
        </article>

        <article className="panel menu-card">
          <h2>ルーム参加</h2>
          <p className="subtle-text">相手から共有された4桁コードで参加します。</p>
          <button type="button" onClick={onJoinRoom}>
            ルームに参加
          </button>
        </article>
      </div>

      <div className="button-row">
        <button type="button" onClick={onBack}>
          トップへ
        </button>
      </div>
    </section>
  );
}
