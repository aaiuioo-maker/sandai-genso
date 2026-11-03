#!/bin/bash
# 声を作るための音声エンジンを、セッションが始まる前に起動しておくスクリプト。
# クラウド環境の設定（セッションのタイトルの環境メニュー → Edit → Setup script）に、
# 下の「ここから」〜「ここまで」をそのまま貼りつけて使う。
# 起動したエンジン：AivisSpeech（http://127.0.0.1:10101）・VOICEVOX（http://127.0.0.1:50021）
# そのあと Claude が  python3 <動画>/koe_tsukuru.py  を動かして声を作る。
# ※ COEIROINK は Docker の公式イメージがないので、ここでは起動しない（その5人は端末の声で読む）

# ---- ここから ----
(dockerd > /tmp/dockerd.log 2>&1 &)
for i in $(seq 1 30); do docker info > /dev/null 2>&1 && break; sleep 1; done

# AivisSpeech（まお・まい・コハク・中2・るな・花音・桜音）
docker pull ghcr.io/aivis-project/aivisspeech-engine:cpu-latest \
  && docker run -d --name aivis -p 10101:10101 ghcr.io/aivis-project/aivisspeech-engine:cpu-latest || true

# VOICEVOX（めたん・つむぎ・はう・小夜・ひまり・ナースロボ）。Docker Hub が混んでいるときは Google のミラーから
( docker pull voicevox/voicevox_engine:cpu-latest && docker tag voicevox/voicevox_engine:cpu-latest vv ) \
  || ( docker pull mirror.gcr.io/voicevox/voicevox_engine:cpu-latest && docker tag mirror.gcr.io/voicevox/voicevox_engine:cpu-latest vv ) || true
docker run -d --name voicevox -p 50021:50021 vv || true
exit 0
# ---- ここまで ----
