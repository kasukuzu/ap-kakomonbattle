# 応用情報 過去問バトル

応用情報技術者試験の午前問題を使った、2人対戦形式の学習用クイズアプリです。

## 主な機能

- 2人のプレイヤー名を入力して対戦
- 年度、期、出題数、分野を選択
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
現在の収録済み実データは `令和6年春 午前`、`令和6年秋 午前`、`令和5年春 午前`、`令和5年秋 午前`、`令和4年春 午前`、`令和4年秋 午前` です。

問題データは次の形式です。画像付き問題は、必要に応じて `questionImage` と `choiceImages` を追加できます。

```json
{
  "id": "r6-autumn-am-21",
  "year": "令和6",
  "season": "秋",
  "examSession": "令和6年秋",
  "section": "午前",
  "questionNumber": 21,
  "category": "テクノロジ",
  "question": "図はスイッチA及びBの状態によって、LEDが点灯又は消灯する回路である。適切なものはどれか。",
  "questionImage": "/images/questions/r6-autumn-am-21-question.png",
  "choices": [
    "タイミングチャート ア",
    "タイミングチャート イ",
    "タイミングチャート ウ",
    "タイミングチャート エ"
  ],
  "choiceImages": [
    "/images/questions/r6-autumn-am-21-a.png",
    "/images/questions/r6-autumn-am-21-i.png",
    "/images/questions/r6-autumn-am-21-u.png",
    "/images/questions/r6-autumn-am-21-e.png"
  ],
  "answer": 2,
  "answerLabel": "ウ",
  "explanation": ""
}
```

画像ファイルを `public/images/...` に置く場合、JSONでは `/images/...` のように指定します。
画像がない問題では `questionImage` と `choiceImages` を省略できます。

## 出題条件

- 年度: `令和6` / `令和5` / `令和4` / `全て`
- 期: `春` / `秋` / `全て`
- 分野: `テクノロジ` / `マネジメント` / `ストラテジ` / `全て`
- 出題数: 選択条件に一致する収録問題数を上限に調整
- 出題順: ランダム出題、または年度・期・問番号順

条件に一致する問題がない場合、対戦開始ボタンは無効になります。

## 新しい回の追加手順

1. `data/questions.json` に対象回の問題を同じ形式で追加する
2. `id` は `r6-spring-am-1` のように年度、期、午前、問番号を含める
3. `year`、`season`、`examSession`、`questionNumber` を各問に設定する
4. 図表が必要な場合は画像を `public/images/questions/` に置き、`questionImage` または `choiceImages` にパスを入れる
5. `npm run build` で読み込みと型チェックを確認する

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
