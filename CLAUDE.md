# sandai-genso（三大元素といのち）

本の掲載頁の教えを、1本3分ほどのドット絵動画（Webページ）にしたものを集めたリポジトリ。GitHub Pages で公開している（aaiuioo-maker/sandai-genso）。

## 話し方

- 返事・まとめ・ボタンは、いつも簡単な日本語で。

## 形

- 動画1本 = フォルダ1つ（ローマ字の短い名前。例：`daigomi/`）。中身：
  - `index.html`：1枚で動く動画。`const CAPS = [[始, 終, '上の行', '下の行', 'ひらがなの読み上げ文', 色], ...]`（字幕、19〜23個）、`const SCENES`（場面の絵）、`const VOICES`（読み手18人）
  - `<フォルダ名>.webmanifest`、`icon-180.png`・`icon-512.png`（専用アイコン、左上にオレンジのキャラクター）
  - `koe_tsukuru.py`：18人の声を作るスクリプト
  - `koe*/NN.mp3`：声のファイル（18フォルダ × 字幕の数）
- `tana/index.html`：動画棚。`const APPS = [` に1行ずつ並ぶ。
- いちばん上の `index.html`：トップページ。
- `omakase/`：声の音量をそろえるときの見本。消したり変えたりしない。
- `heiwa`・`henji`・`tana` などは形のちがうページ。

## 声

- エンジン：VOICEVOX（50021）・AivisSpeech（10101）・COEIROINK v2（50032）。止まっていたら koe-kidou スキルで起動する。
- 読み手18人：VOICEVOX 6人（めたん・つむぎ・はう・小夜・ひまり・ナースロボ）、COEIROINK 5人（つくよみちゃん・MANA・KANA・アメノちゃん 熊本弁・リリンちゃん）、AivisSpeech 7人（まお・まい・コハク・中2・るな・花音・桜音）。
- Python と ffmpeg は PATH に無い。StreamFab のものを使う：
  ```bash
  export PATH="/c/Program Files/DVDFab/StreamFab:$PATH"
  "/c/Program Files/DVDFab/StreamFab/PYthon37/python.exe" -I <フォルダ>/koe_tsukuru.py
  ```
  声を作るのは時間がかかるので、裏（run_in_background）で動かす。
- 作ったら koe-checker（または koe-check スキル）で確かめる。声のエンジンのフォルダは書きかえない。

## 新しい動画を作るとき

- dotto-douga スキルの順番どおりに進める（見本はいちばん新しい動画）。
- 絵の下書きや見本の画像がほしいときは gemini-gazou スキル（Gemini）を使ってよい。ただし動画の中の絵は、今までどおり index.html の中でドット絵として描く。

## コミット

- コミットのメッセージは日本語で、前のコミットと同じ形（何を足したか・あらすじ・字幕の数）。
- 1回目：動画のページ（声はまだ）。2回目：18人の声。
- main へのマージや GitHub への push は、頼まれたときだけ。
