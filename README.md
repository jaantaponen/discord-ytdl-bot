## Discord download bot

This Discord bot downloads your links prefixed with `!` and sends them as a reply to the channel. It will try to transcode the videos so we don't exceed the free 8mb limit.


```console

version: "3.9"
   
services:
  bot:
    build: https://github.com/jaantaponen/discord-ytdl-bot.git
    environment:
      - TOKEN="BOT TOKEN"

```