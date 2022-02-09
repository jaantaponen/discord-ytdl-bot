require('dotenv').config()
const spawn = require('child_process').spawn;
const { Client } = require("discord.js");
const yt = require('youtube-search-without-api-key');
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const path = require("path");
var moment = require('moment');

client.once('ready', () => {
    console.log('Bot is running!');
});
const prefix = "!";
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift()
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }
    else if (command === "s") {
        const searchTerm = args.join(' ')
        const videos = await yt.search(searchTerm);
        const topResults = videos.length > 9 ? videos.slice(0, 9) : videos
        const shortVideo = topResults.find(x => moment(x.duration_raw, "mm:ss").minutes() < 1)
        if (shortVideo) {
            return await handleProcess(message, shortVideo.url, true)
        } else {
            return message.reply(`Hyvä hakusana.... no videos under 1minute found from top 10 results ${Date.now() - message.createdTimestamp}ms`);
        }
    }
    else if (isValidHttpUrl(command)) {
        return await handleProcess(message, command)
    }
});


const handleProcess = async (message, url, reply) => {
    const filename = await downloadVideo(url)
    if (!filename) return message.reply(`Hyvä linkki... failed to ytdl... ${Date.now() - message.createdTimestamp}ms`);
    const videoOK = await transcode(filename, 30)
    if (!videoOK) return message.reply(`Hyvä linkki... failed to transcode ${Date.now() - message.createdTimestamp}ms`);

    if (await getFileSize(filename) > 8) {
        await transcode(filename, 40)
    } else {
        if (await getFileSize(filename) > 8) message.reply(`Hyvä linkki... after downgrade filesize was: ${finalSize}Mb`);
    }
    if (reply) {
        message.reply({ files: [`output-${filename}`] })
    } else {
        message.channel.send({ files: [`output-${filename}`] })
        message.delete()
    }
    await fs.unlink(filename)
    await fs.unlink(`output-${filename}`)
}

client.login(process.env.TOKEN)

const getFileSize = async filename => {
    const stats = await fs.stat(`output-${filename}`)
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMegabytes
}

const downloadVideo = async (link) => new Promise((resolve, reject) => {
    const filename = nanoid(8)
    const ytdlp = spawn('yt-dlp', ["--verbose", "--max-filesize", "65m", "-S", "res,ext:mp4:m4a", "--recode", "mp4", "-o", `${filename}.%(ext)s`, `${link}`]);
    ytdlp.stderr.on('data', (data) => {
        console.log(data.toString())
    });
    ytdlp.stdout.on('data', (data) => {
        console.log(data.toString())
    });
    ytdlp.on('close', async (code) => {
        const files = await fs.readdir(__dirname);
        resolve(files.find(x => x.includes(filename)));
    });
});

const transcode = (filename, crf) => new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', "-vsync", "0", "-hwaccel", "cuvid", "-c:v", "h264_cuvid", '-i', `${filename}`, "-c:v", "h264_nvenc", '-preset', 'slow', "-crf", crf, "-c:a", "aac", "-b:a", "128k", `output-${filename.split(".")[0]}.mp4`]);
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
