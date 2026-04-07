# 応用情報 過去問バトル

応用情報技術者試験の午前問題を使った、2人対戦形式の学習用クイズアプリです。

## 主な機能

- 2人のプレイヤー名を入力して対戦
- 出題数と分野を選択
- ランダム出題、問題番号順の切り替え
- 4択回答と正解／不正解の表示
- 結果画面で正解数、正答率、勝敗を表示
- LocalStorage に対戦履歴を保存
- 各問の回答内容を履歴に保存
- 間違えた問題だけ復習
- 画像付き問題の表示に対応

## 技術構成

- React
- Vite
- TypeScript
- CSS
- LocalStorage

## セットアップ

```bash
npm install
npm run dev
```

起動後、ターミナルに表示されたローカルURLをブラウザで開きます。
通常は `http://localhost:5173/` です。

## ビルド

```bash
npm run build
```

## データ

問題データは `data/questions.json` を使用します。
アプリはPDFを直接読み込まず、JSON化された問題データだけを参照します。

画像付き問題は、必要に応じて次のフィールドを追加できます。

```json
{
  "id": "ap-r06-autumn-am-021",
  "season": "令和6年度秋期",
  "exam": "応用情報技術者試験",
  "section": "午前",
  "category": "テクノロジ",
  "question": "図はスイッチA及びBの状態によって、LEDが点灯又は消灯する回路である。適切なものはどれか。",
  "questionImage": "/images/questions/ap-r06-autumn-am-021-question.png",
  "choices": [
    "タイミングチャート ア",
    "タイミングチャート イ",
    "タイミングチャート ウ",
    "タイミングチャート エ"
  ],
  "choiceImages": [
    "/images/questions/ap-r06-autumn-am-021-a.png",
    "/images/questions/ap-r06-autumn-am-021-i.png",
    "/images/questions/ap-r06-autumn-am-021-u.png",
    "/images/questions/ap-r06-autumn-am-021-e.png"
  ],
  "answer": 2,
  "answerLabel": "ウ",
  "explanation": ""
}
```

画像ファイルを `public/images/...` に置く場合、JSONでは `/images/...` のように指定します。
画像がない問題では `questionImage` と `choiceImages` を省略できます。

## 公開対象から除外するもの

`.gitignore` で次を除外しています。

- `node_modules/`
- `dist/`
- `.DS_Store`
- `.env*`
- `*.tsbuildinfo`
- `*.log`
- `data/raw/`

`data/raw/` にはPDF原本を置けますが、アプリの実行には不要です。

## npm scripts

```bash
npm run dev
npm run build
npm run preview
```
