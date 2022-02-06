
const spawn = require('child_process').spawn;
const Discord = require("discord.js");
require('dotenv').config()
const { nanoid } = require("nanoid");

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

const prefix = "!";

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);      
    }
    else if (command === "dl") {
        const parameter = args.shift().toLowerCase();
        message.reply(`This is a valid link ${isValidHttpUrl(parameter)}!`);
      }   
  });

// Login to Discord with your client's token
//client.login(process.env.TOKEN)



const downloadVideo = async (link) => new Promise((resolve, reject) => {
    const filename = nanoid(8)
    let outputFilename = undefined
    const ytdlp = spawn('yt-dlp', ['-o', filename, `${link}`]);
    ytdlp.stderr.on('data', (data) => {
        console.log(`${data}`);
        resolve()
    });
    ytdlp.stdout.on('data', (data) => {
        const row = data.toString()
        if (row.includes('Destination:')) {
            outputFilename = row.split(' ').pop()
        }
    });
    ytdlp.on('close', (code) => {
        resolve(outputFilename);
    });
});

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

const isValidHttpUrl = (string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }


// https://trac.ffmpeg.org/wiki/Encode/H.264#twopass
const calculateFileSize = (seconds) => {
    // (8 MiB * 8192 [converts MiB to kBit]) / x seconds
    const videoSizekBit = (8 * 8192) / seconds
    // videoSizekBit - 128 kBit/s (desired audio bitrate) = x kBit/s video bitrate
    const fileSizekBit = videoSizekBit - 128
    return fileSizekBit
}

//downloadVideo("").then(data => console.log(data))
//getVideoLength('8N_eHxCd.webm').then(data => console.log(data))


/* const p = new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', `${parent}/${video}.mp4`, '-codec:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-b:v', '400k', '-maxrate', '400k', '-bufsize', '800k', '-vf', `scale=-2:${quality}`, '-threads', '0', '-b:a', '128k', `${parent}/transcoded/${video}_${quality}.mp4`]);
    ffmpeg.stderr.on('data', (data) => {
        console.log(`${data}`);
    });
    ffmpeg.on('close', (code) => {
        resolve();
    });
});
return p; */