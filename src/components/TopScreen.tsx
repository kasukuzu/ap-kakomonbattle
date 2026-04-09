type TopScreenProps = {
  onLocalStart: () => void;
  onOnlineStart: () => void;
  onHistory: () => void;
};

export function TopScreen({ onLocalStart, onOnlineStart, onHistory }: TopScreenProps) {
  return (
    <section className="screen top-screen">
      <div className="hero-panel">
        <p className="eyebrow">複数年度対応 午前</p>
        <h1>応用情報 過去問バトル</h1>
        <p className="lead">ローカル対戦とオンライン対戦の両方で、同じ問題セットを解いて正答率を競います。</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onLocalStart}>
            ローカル対戦
          </button>
          <button type="button" onClick={onOnlineStart}>
            オンライン対戦
          </button>
          <button type="button" onClick={onHistory}>
            履歴を見る
          </button>
        </div>
      </div>
    </section>
  );
}
