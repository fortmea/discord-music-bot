/* Oroboros generated with create-discord-bot CLI */
const Discord = require('discord.js')
const config = require('./config.json')
const prefix = config['prefix']
const client = new Discord.Client()
const ytdl = require('ytdl-core-discord');
const queue = new Map();
const available_commands = ['tocar', 'pular', 'parar'];
var count = 0;
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
            //console.log(message.content.split(" ")[0])
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
    //console.log(voiceChannel)
    if (voiceChannel == undefined) {
        return message.channel.send(`Você precisa estar em um canal de música para executar um comando!`);
    } else {
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
        if (args[1] == undefined) {
            return message.channel.send(`Você precisa incluir um link para a música que deseja tocar!`);
        } else {
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
                console.log(message.member.guild.id + "GUILD ID")
                queue.set(message.member.guild.id, queueContruct);

                queueContruct.songs.push(song);

                try {
                    const channelToJoin = client.channels.get(voiceChannel);
                    var connection = await channelToJoin.join();
                    queueContruct.connection = connection;
                    console.log(message.member.guild.id);
                    const msg = message;
                    play(message.member.guild.id, msg);
                } catch (err) {
                    console.log(err);
                    queue.delete(message.member.guild.id);
                    return message.channel.send(err);
                }
            } else {
                if (serverQueue.songs[0]) {
                    serverQueue.songs.push(song);
                    return message.channel.send(`**${song.title}** foi adicionado à fila!`);
                } else {
                    const channelToJoin = client.channels.get(voiceChannel);
                    var connection = await channelToJoin.join();
                    serverQueue.songs.push(song);
                    play(message.member.guild.id,  message);
                }
            }
        }
    }
}

function skip(message, serverQueue) {
    if (!message.member.voiceChannelID)
        return message.channel.send(
            "Você precisa estar em um canal de voz para parar a música!"
        );
    if (!serverQueue)
        return message.channel.send("Não há musica para pular!");
    console.log(serverQueue.songs.shift());
    play(message.member.guild.id, serverQueue.songs[0], message)
}

function stop(message, serverQueue) {
    if (!message.member.voiceChannelID)
        return message.channel.send(
            "Você tem que estar em um canal de música para executar este comando!"
        );

    if (!serverQueue)
        return message.channel.send("Não há musica para parar!");

    serverQueue.songs = [];
    message.guild.me.voiceChannel.leave();
}

async function play(guild, message) {
    const serverQueue = queue.get(guild);
    song = serverQueue.songs[0]
    console.log(guild);
    //console.log(serverQueue)
    
    count = count+1;
    console.log("CONTAGEM> "+count);
    if (!song) {
        serverQueue.textChannel.send(`Não há mais itens na fila, saindo...`);
        message.guild.me.voiceChannel.leave();
        queue.delete(guild);
        return;
    }
    const stream = await ytdl(song.url);
    const dispatcher = serverQueue.connection.playOpusStream(stream).on("end", () => {
        serverQueue.songs.shift(); play(guild, message);

    }
    ).on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 1);
    serverQueue.textChannel.send(`Tocando agora: **${song.title}**`);
    
}
client.login(config['token']);