# 応用情報 過去問バトル

応用情報技術者試験の午前問題を使った、2人対戦形式の学習アプリです。  
ローカル対戦と、4桁ルームコードを使うオンライン対戦に対応しています。

現在は以下の6回分を収録しています。

- 令和6年春
- 令和6年秋
- 令和5年春
- 令和5年秋
- 令和4年春
- 令和4年秋

## アプリ概要

このアプリは、同じ問題セットを2人で解いて正答率を競うことを目的にしています。

- ローカル対戦では1台で2人が順番に回答
- オンライン対戦では4桁コードでルームを共有
- 年度、期、分野、出題数、出題順を指定して出題
- 図や表を含む問題は、事前生成したPNG画像を表示
- 対戦結果は履歴として保存し、間違えた問題だけ復習可能

## 主な機能

- ローカル対戦
  - 2人のプレイヤー名入力
  - 同一問題セットでの4択対戦
  - 正解 / 不正解の即時表示
  - 結果画面で正解数、正答率、勝敗を表示
- オンライン対戦
  - 4桁ルームコードによる作成 / 参加
  - 同じ `questionIds` を共有して対戦
  - 各プレイヤーが自分のペースで進行
  - 相手の進捗をリアルタイムゲージで表示
  - 相手切断時の簡易メッセージ表示
- 学習機能
  - 年度、期、分野での絞り込み
  - ランダム出題 / 問題番号順
  - 経過時間表示
  - LocalStorage 履歴保存
  - 各問の回答内容保存
  - 間違えた問題だけ復習
- 図表問題対応
  - `questionImage`
  - `answerAreaImage`
  - `choiceImages`
  - PDFから事前にPNGへ切り出して表示

## 使用技術

- React 19
- Vite 7
- TypeScript 5
- Firebase Authentication
  - 匿名認証
- Firebase Realtime Database
  - オンライン対戦のルーム同期
- LocalStorage
  - 履歴保存
- PyMuPDF
  - 問題PDFの図表切り出し
- CSS
  - レスポンシブ対応、アニメーション、進捗ゲージ表現

## ローカル起動方法

依存関係を入れて起動します。

```bash
npm install
npm run dev
```

通常は次のURLで確認できます。

```text
http://localhost:5173/
```

本番ビルド確認:

```bash
npm run build
npm run preview
```

## Firebase 環境変数設定

オンライン対戦を使う場合は、`.env.local` に以下を設定します。

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

環境変数が未設定でも、ローカル対戦は動作します。  
その場合、オンライン対戦画面では設定不足メッセージを表示します。

### Firebase コンソール側で必要な設定

1. Firebase プロジェクトを作成
2. Web App を追加
3. Authentication で `匿名` サインインを有効化
4. Realtime Database を作成
5. Database URL を取得
6. Realtime Database Rules を設定

MVP向けの最小ルール例:

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

## オンライン対戦の使い方

1. トップ画面から `オンライン対戦` を選ぶ
2. ホスト側が `ルーム作成` を選び、名前と出題条件を設定する
3. 4桁ルームコードを相手に共有する
4. 参加側が `ルーム参加` を選び、名前と4桁コードを入力する
5. 2人そろったらホストが開始する
6. 同じ問題セットを同じ順番で解く
7. ただし進行はプレイヤーごとに独立しており、待たずに先へ進める
8. 両者が完了すると結果画面へ移動する

オンライン対戦中は以下を表示します。

- 経過時間
- 自分の進捗
- 相手の進捗ゲージ
- 相手の完了状態
- 接続切断の簡易メッセージ

## データと問題画像

問題データは `data/questions.json` を使用します。  
本番アプリではPDFを直接読みません。

現在の問題データ形式:

```json
{
  "id": "r6-autumn-am-21",
  "year": "令和6",
  "season": "秋",
  "examSession": "令和6年秋",
  "section": "午前",
  "questionNumber": 21,
  "category": "テクノロジ",
  "question": "図はスイッチ A 及び B の状態によって、LED が点灯又は消灯する回路である。…",
  "questionImage": "/question-assets/r6-autumn-am-21-question.png",
  "answerAreaImage": "/question-assets/r6-autumn-am-21-answer-area.png",
  "choices": [
    "タイミングチャート ア（画像選択肢）",
    "タイミングチャート イ（画像選択肢）",
    "タイミングチャート ウ（画像選択肢）",
    "タイミングチャート エ（画像選択肢）"
  ],
  "choiceImages": [null, null, null, null],
  "answer": 2,
  "answerLabel": "ウ",
  "explanation": ""
}
```

画像がない問題では `questionImage`、`answerAreaImage`、`choiceImages` は省略できます。

### 図表画像の生成

図表は `scripts/asset_map.json` で管理し、`scripts/extract_question_assets.py` で PNG を生成します。

前提:

```bash
python3 -m pip install PyMuPDF
```

全件生成:

```bash
python3 scripts/extract_question_assets.py --overwrite
```

特定IDだけ生成:

```bash
python3 scripts/extract_question_assets.py --id r6-autumn-am-21 --overwrite
```

出力先:

- `public/question-assets/{id}-question.png`
- `public/question-assets/{id}-answer-area.png`

## Vercel デプロイについて

このプロジェクトは Vercel で公開できます。  
Vercel 側では以下を設定してください。

### Build 設定

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### Environment Variables

ローカルと同じ `VITE_FIREBASE_*` を Vercel に設定します。

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

設定後に再デプロイが必要です。

### 公開時の注意

- Firebase Authentication の承認済みドメインに、公開URLを追加してください
- Realtime Database Rules は少なくとも匿名認証済みユーザーの読書きを許可する必要があります
- `data/raw/` のPDF原本はアプリ実行には不要で、公開対象にも含めません

## 今後の改善予定

- `asset_map.json` を埋めて、図表問題を全問カバーする
- 図付き選択肢の切り出しを `choiceImages` まで広げる
- オンライン対戦の再接続復帰を強化する
- ルームの自動掃除、期限切れ削除を追加する
- Firebase Rules をより厳密にする
- `questions.json` の分割や dynamic import による chunk 最適化
- 解説データの追加
- 復習画面の検索、絞り込み、再出題

## npm scripts

```bash
npm run dev
npm run build
npm run preview
```
