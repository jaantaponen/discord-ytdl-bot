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
    build: https://github.com/jaantaponen/discord-ytdl-bot.git
    environment:
      - TOKEN="BOT TOKEN"

```
