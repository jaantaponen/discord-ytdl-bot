
const spawn = require('child_process').spawn;
const { Client } = require("discord.js");
require('dotenv').config()
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

client.once('ready', () => {
    console.log('Bot is running!');
});
const prefix = "!";
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }
    else if (isValidHttpUrl(command)) {
        try {
            const filename = await downloadVideo(command)
            if (!filename) return message.reply(`Hyvä linkki... failed to ytdl... ${Date.now() - message.createdTimestamp}ms`);
            const videoOK = await transcode(filename, 30)
            if (!videoOK) return message.reply(`Hyvä linkki... failed to transcode ${Date.now() - message.createdTimestamp}ms`);
            
            if (await getFileSize(filename) > 8) {
                await transcode(filename, 40)
            } else {
                if (await getFileSize(filename) > 8) message.reply(`Hyvä linkki... after downgrade filesize was: ${finalSize}Mb`);
            }
            message.channel.send({
                files: [`output-${filename}`]
            })

            message.delete()
            await fs.unlink(filename)
            await fs.unlink(`output-${filename}`)
        } catch (e) {
            console.log("naura", e.message)
            return message.reply(`Hyvä linkki... ${Date.now() - message.createdTimestamp}ms`);
        }
    }
});

client.login(process.env.TOKEN)

const getFileSize = async filename => {
    const stats = await fs.stat(`output-${filename}`)
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMegabytes
}

const downloadVideo = async (link) => new Promise((resolve, reject) => {
    const filename = nanoid(8)
    const ytdlp = spawn('yt-dlp', ["-S", "res,ext:mp4:m4a", "--recode", "mp4", "-o", `${filename}.mp4`, `${link}`]);
    ytdlp.stderr.on('data', (data) => {
        console.error(data.toString())
        resolve()
    });
    ytdlp.stdout.on('data', (data) => {
    });
    ytdlp.on('close', (code) => {
        resolve(`${filename}.mp4`);
    });
});


const transcode = (filename, crf) => new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', '-i', `${filename}`, '-c:v', 'libx264', '-preset', 'slow', "-crf", crf, "-c:a", "aac", "-b:a", "128k", `output-${filename}`]);
    ffmpeg.stderr.on('data', (data) => {
        console.log(`${data}`);
    });
    ffmpeg.on('close', async (code) => {
        const duration = await getVideoLength(`output-${filename}`)
        resolve(duration > 0)
    });
});

const isValidHttpUrl = (string) => {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

const getVideoLength = (filename) => new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filename]);
    let duration = 0
    ffprobe.stderr.on('data', (data) => {
        console.log(`${data}`);
    });
    ffprobe.stdout.on('data', (data) => {
        duration = data.toString()
    });
    ffprobe.on('close', (code) => {
        if (code === 0) {
            resolve(Number(duration));
        }
        resolve(-1)
    });
});

// https://trac.ffmpeg.org/wiki/Encode/H.264#twopass
const calculateBitrate = (seconds) => {
    // (8 MiB * 8192 [converts MiB to kBit]) / x seconds
    const videoSizekBit = (8 * 8192) / seconds
    // videoSizekBit - 128 kBit/s (desired audio bitrate) = x kBit/s video bitrate
    const fileSizekBit = videoSizekBit - 128
    return fileSizekBit
}