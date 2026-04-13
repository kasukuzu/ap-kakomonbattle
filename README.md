# AP Kakomon Battle

応用情報技術者試験の過去問題を使って、2人で対戦できる学習アプリです。  
ローカル対戦と、4桁ルームコードを使ったオンライン対戦に対応しています。

現在は午前問題に対応しており、複数年度・複数回の問題セットから出題できます。  
アプリ本体は PDF を直接読み込まず、[`data/questions.json`](/Users/karasawakei/Desktop/ap-kakomon-battle/data/questions.json) と事前生成した画像アセットを使って表示します。

## 収録データ

現時点で収録している回は次のとおりです。

- 平成31年春
- 令和元年秋
- 令和2年
- 令和3年春
- 令和3年秋
- 令和4年春
- 令和4年秋
- 令和5年春
- 令和5年秋
- 令和6年春
- 令和6年秋

合計 880 問を収録しています。

年度ごとの開催回:

- `令和6`〜`令和3`: 春 / 秋
- `令和2`: 1回開催
- `令和元`: 秋のみ
- `平成31`: 春のみ

## 主な機能

- ローカル対戦
  - 1台で2人が同じ問題セットを解いて正答率を競う
- オンライン対戦
  - 4桁ルームコードでルーム作成 / 参加
  - 同じ問題セットを共有しつつ、各プレイヤーは自分のペースで進行
  - 相手の進捗ゲージをリアルタイム表示
- 経過時間表示
  - クイズ開始からの経過時間を `mm:ss` で表示
- 履歴保存
  - LocalStorage に対戦結果を保存
  - 各問の回答内容も保持
- 復習
  - 結果画面から間違えた問題だけを確認
- 図表問題対応
  - `questionImage`
  - `answerAreaImage`
  - `choiceImages`
- 柔軟な出題条件
  - 年度
  - 期
  - 分野
  - 出題数
  - 順番 / ランダム

## 使用技術

- React 19
- Vite 7
- TypeScript 5
- Firebase Authentication
  - Anonymous Auth
- Firebase Realtime Database
- LocalStorage
- PyMuPDF
  - 図表画像の事前切り出し用スクリプトで使用

## ローカル起動方法

依存関係を入れて起動します。

```bash
npm install
npm run dev
```

通常は次の URL で確認できます。

```text
http://localhost:5173/
```

本番ビルド確認:

```bash
npm run build
```

ビルド済みファイルのプレビュー:

```bash
npm run preview
```

## npm scripts

- `npm run dev`: 開発サーバー起動
- `npm run build`: TypeScript ビルド + Vite ビルド
- `npm run preview`: ビルド済みアプリのローカル確認

## Firebase 環境変数

オンライン対戦を使う場合は、以下の環境変数が必要です。  
ローカル対戦だけなら未設定でも動きます。

`.env.local` 例:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

必要なキー:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase コンソール設定

オンライン対戦で必要な設定です。

### 1. Web アプリを追加

Firebase プロジェクトを作成し、Web アプリを追加して設定値を取得します。

### 2. Authentication

- `Authentication` を有効化
- `Sign-in method` で `匿名` を有効化

### 3. Realtime Database

- `Realtime Database` を作成
- ルーム情報を保存できるようにする

MVP 向けの最低限の Rules 例:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

この Rules は簡易版です。公開運用では絞り込みを強める方が安全です。

## オンライン対戦の使い方

1. トップ画面から `オンライン対戦` を開く
2. ホスト側が `ルーム作成`
3. 4桁コードを相手に共有
4. ゲスト側が `ルーム参加` からコードを入力
5. 2人そろったらホストが開始
6. 同じ `questionIds` を同じ順番で受け取って対戦開始
7. 各プレイヤーは相手を待たずに自分のペースで進行
8. 両者完了後に結果画面へ遷移

## 問題データ形式

問題データは [`data/questions.json`](/Users/karasawakei/Desktop/ap-kakomon-battle/data/questions.json) にまとめています。

例:

```json
{
  "id": "r6-autumn-am-21",
  "year": "令和6",
  "season": "秋",
  "examSession": "令和6年秋",
  "section": "午前",
  "questionNumber": 21,
  "category": "テクノロジ",
  "question": "問題文",
  "questionImage": "/question-assets/r6-autumn-am-21-question.png",
  "answerAreaImage": "/question-assets/r6-autumn-am-21-answer-area.png",
  "choices": [
    "アの選択肢",
    "イの選択肢",
    "ウの選択肢",
    "エの選択肢"
  ],
  "choiceImages": [
    null,
    null,
    null,
    null
  ],
  "answer": 2,
  "answerLabel": "ウ",
  "explanation": ""
}
```

補足:

- `questionImage` は問題図
- `answerAreaImage` は図付き解答欄や選択肢群の補助画像
- `choiceImages` は各選択肢ごとの画像
- `令和2` は `season: "なし"` を使っています

## 年度・期の扱い

対戦設定画面では、年度に応じて有効な期だけ選べます。

- `令和6`〜`令和3`
  - `全て / 春 / 秋`
- `令和2`
  - `期なし`
- `令和元`
  - `秋のみ`
- `平成31`
  - `春のみ`

無効な組み合わせは UI と出題ロジックの両方で防いでいます。

## 図表画像の管理

図表付き問題は、PDF から事前に切り出した PNG を使います。  
本番アプリでは PDF を直接扱いません。

関連ファイル:

- [`scripts/asset_map.json`](/Users/karasawakei/Desktop/ap-kakomon-battle/scripts/asset_map.json)
- [`scripts/extract_question_assets.py`](/Users/karasawakei/Desktop/ap-kakomon-battle/scripts/extract_question_assets.py)
- [`scripts/fetch_missing_visual_assets.py`](/Users/karasawakei/Desktop/ap-kakomon-battle/scripts/fetch_missing_visual_assets.py)
- 出力先: [`public/question-assets/`](/Users/karasawakei/Desktop/ap-kakomon-battle/public/question-assets)

### 画像切り出し

PyMuPDF をインストール:

```bash
python3 -m pip install PyMuPDF
```

`asset_map.json` に定義した画像を一括生成:

```bash
python3 scripts/extract_question_assets.py --overwrite
```

特定の問題だけ生成:

```bash
python3 scripts/extract_question_assets.py --id r6-autumn-am-21 --overwrite
```

### 未対応画像の補完

未対応だった図表画像をまとめて補完するスクリプト:

```bash
python3 scripts/fetch_missing_visual_assets.py
```

## 旧年度データの追加

旧年度の取り込み用スクリプト:

- [`scripts/import_legacy_sessions.py`](/Users/karasawakei/Desktop/ap-kakomon-battle/scripts/import_legacy_sessions.py)

このスクリプトでは、次のような特殊なファイル名ルールも吸収しています。

- 通常: `r6-autumn-answers`, `r6-spring-answers`
- `令和2`: `r2-answers`
- `令和元年秋`: `r-autumn-answers`
- `平成31年春`: `h31-spring-answers`

## Vercel デプロイ

Vercel では通常の Vite アプリとしてデプロイできます。

設定の目安:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

必要な環境変数:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

加えて、Firebase Authentication 側で Vercel の公開ドメインを許可してください。

## 今後の改善予定

- Firebase Rules の厳格化
- オンライン対戦の再接続復帰
- 問題ごとの解説追加
- 図付き選択肢の整備をさらに進める
- 画像アセット管理の自動化
- 問題データ増加に伴う chunk 最適化

