require('dotenv').config()
const spawn = require('child_process').spawn;
const { Client } = require("discord.js");
const ytsr = require('ytsr');
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const moment = require('moment');

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
        message.channel.sendTyping()
        const searchTerm = args.join(' ')
        const { items: videos } = await ytsr(searchTerm);
        const topResults = videos.length > 9 ? videos.slice(0, 9) : videos
        const shortVideo = topResults.find(x => moment(x.duration, "mm:ss").minutes() < 1)
        if (shortVideo) {
            return await handleProcess(message, shortVideo.url, true)
        } else {
            return message.reply(`Hyvä hakusana.... no videos under 1minute found from top 10 results ${Date.now() - message.createdTimestamp}ms`);
        }
    }
    else if (isValidHttpUrl(command)) {
        message.suppressEmbeds(true)
        await handleProcess(message, command)
    }
});


const handleProcess = async (message, url, reply) => {
    message.channel.sendTyping()
    const filename = await downloadVideo(url)
    if (!filename) return message.reply(`Hyvä linkki... failed to ytdl... ${Date.now() - message.createdTimestamp}ms`);
    if (await getFileSize(filename) >= 25) {
        const smaller = await transcode(filename, 39)
        if (!smaller) return message.reply(`Hyvä linkki... failed to transcode ${Date.now() - message.createdTimestamp}ms`)
        const smallerSize = await getFileSize(`output-${filename}`)
        if (smallerSize > 25) return message.reply(`Hyvä linkki... after downgrade filesize was: ${smallerSize}Mb`)
    } else {
        await fs.rename(filename, `output-${filename}`)
    }

    if (reply) {
        message.reply({ files: [`output-${filename}`] })
    } else {
        message.channel.send({ files: [`output-${filename}`] })
        message.delete()
    }
}

client.login(process.env.TOKEN)

const getFileSize = async filename => {
    const stats = await fs.stat(filename)
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMegabytes
}

const downloadVideo = async (link) => new Promise((resolve, reject) => {
    const filename = nanoid(8)
    console.log("starting to download: ", link)
    const targetSizeInM = 20
    const ytdlp = spawn('yt-dlp', [
        "--verbose",
        "--no-playlist",
        "-f",
        `((bv*[filesize<=${targetSizeInM}]/bv*)[height<=720]/(wv*[filesize<=${targetSizeInM}]/wv*)) + ba / (b[filesize<=${targetSizeInM}]/b)[height<=720]/(w[filesize<=${targetSizeInM}]/w)`,
        "-S",
        "codec:h264",
        "--merge-output-format",
        "mp4",
        "-o",
        `${filename}.%(ext)s`,
        `${link}`
    ]);
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
    const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-i',
        `${filename}`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        "-crf",
        crf,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        `output-${filename.split(".")[0]}.mp4`
    ])
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
