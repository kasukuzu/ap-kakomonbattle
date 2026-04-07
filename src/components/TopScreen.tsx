type TopScreenProps = {
  onStart: () => void;
  onHistory: () => void;
};

export function TopScreen({ onStart, onHistory }: TopScreenProps) {
  return (
    <section className="screen top-screen">
      <div className="hero-panel">
        <p className="eyebrow">令和6年度秋期 午前</p>
        <h1>応用情報 過去問バトル</h1>
        <p className="lead">2人で同じ問題を解いて、正答率を競います。</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onStart}>
            対戦を始める
          </button>
          <button type="button" onClick={onHistory}>
            履歴を見る
          </button>
        </div>
      </div>
    </section>
  );
}
