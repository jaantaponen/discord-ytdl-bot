## Discord download bot

This Discord bot downloads your links prefixed with `!` and sends them as a reply to the channel. 

This bot can:
- Try to transcode the videos so we don't exceed the free 8mb limit.
- Delete the original message if the video was able to be downloaded
- Install yt-dlp from source every rebuild
- Hardware transcoding support

#### Example docker-compose (version >= 1.29.*)

```yml

version: "3.9"   
services:
  firstbot:
    build: https://github.com/jaantaponen/discord-ytdl-bot.git#arm64-support
    restart: unless-stopped
    environment:
      - TOKEN=ASDASD

  secondbot:
    build: https://github.com/jaantaponen/discord-ytdl-bot.git#arm64-support
    restart: unless-stopped
    environment:
      - TOKEN=ASDASD
```
