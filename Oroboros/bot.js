/* Oroboros generated with create-discord-bot CLI */
const Discord = require('discord.js')
const config = require('./config.json')
const prefix = config['prefix']
const client = new Discord.Client()
const ytdl = require('ytdl-core-discord');
const queue = new Map();
const available_commands = ['tocar', 'pular', 'parar'];
client.on('ready', () => {
    console.log('Bot is ready!')
})
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});
client.on("message", async message => {
    var command_exists = false;
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) {
        for (i = 0; i < available_commands.length; i++) {
            if (message.content.split(" ")[0] == prefix + available_commands[i]) {
                command_exists = true;
                console.log(message.content.split(" ")[0])
            }
        }

        if (command_exists == false) {
            console.log(message.content.split(" ")[0])
            message.channel.send("You need to enter a valid command!");
            return;
        } else {
            if (!message.content.startsWith(prefix)) return;

            const serverQueue = queue.get(message.guild.id);

            if (message.content.startsWith(`${prefix}tocar`)) {
                execute(message, serverQueue);
                return;
            } else if (message.content.startsWith(`${prefix}pular`)) {
                skip(message, serverQueue);
                return;
            } else if (message.content.startsWith(`${prefix}parar`)) {
                stop(message, serverQueue);
                return;
            }
        }
    }
});
async function execute(message, serverQueue) {
    const args = message.content.split(" ");
    const voiceChannel = message.member.voiceChannelID;
    /* console.log(message);
     
     if (!voiceChannel)
         return message.channel.send(
             "You need to be in a voice channel to play music!"
         );
     const permissions = voiceChannel.permissionsFor(message.client.user);
     if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
         return message.channel.send(
             "I need the permissions to join and speak in your voice channel!"
         );
     }
 */
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.member.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            const channelToJoin = client.channels.get(voiceChannel);
            var connection = await channelToJoin.join();
            queueContruct.connection = connection;
            console.log(message.member.guild.id);

            play(message.member.guild.id, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.member.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voiceChannelID)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    console.log(serverQueue.songs.shift());
    play(message.member.guild.id, serverQueue.songs[0])
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

async function play(guild, song) {
    const serverQueue = queue.get(guild);
    if (!song) {
        message.guild.me.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection.playOpusStream(await ytdl(song.url)).on("finish", () => { serverQueue.songs.shift(); play(guild, serverQueue.songs[0]); }).on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 1);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
client.login(config['token']);