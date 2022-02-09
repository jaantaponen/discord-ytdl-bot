## Discord download bot

This Discord bot downloads your links prefixed with `!` and sends them as a reply to the channel. 

This bot can:
- Try to transcode the videos so we don't exceed the free 8mb limit.
- Delete the original message if the video was able to be downloaded
- Install yt-dlp from source every rebuild

#### Example docker-compose

```console

version: "3.9"
   
services:
  bot:
    build: https://github.com/jaantaponen/discord-ytdl-bot.git#main
    restart: unless-stopped
    environment:
      - TOKEN="BOT TOKEN"

```

#### Running with HW acceleration

```docker

docker build -t ytdl-bot . && \
docker run --rm -it --gpus 1 \
    -e NVIDIA_VISIBLE_DEVICES=all \
    -e NVIDIA_DRIVER_CAPABILITIES=compute,utility,video \
    -e TOKEN="XXXXXXXXXXXXXXXXXXXXXXXX" \
    ytdl-bot
