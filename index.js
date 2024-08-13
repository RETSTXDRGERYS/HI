// Import the necessary discord.js classes and node-fetch for API calls
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fetch = import('node-fetch');
require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;  // Add your client ID here
const guildId = process.env.GUILD_ID;    // Add your guild ID here

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

// Command definitions
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Replies with Hello!'),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Shuts down the bot'),
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Nukes a channel by deleting and recreating it'),
    
    
]
.map(command => command.toJSON());

// Register the commands
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Listen for interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'hello') {
        await interaction.reply(`Hello, ${interaction.user.username}!`);
    } else if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return await interaction.reply('You do not have permissions to use this command.');
        }

        const user = interaction.options.getUser('target');
        const member = interaction.guild.members.cache.get(user.id);

        if (member) {
            member.ban({ reason: 'They were bad!' })
                .then(() => {
                    interaction.reply(`${user.tag} was banned.`);
                })
                .catch(err => {
                    interaction.reply('I was unable to ban the member.');
                    console.error(err);
                });
        } else {
            interaction.reply('That user isn\'t in this guild!');
        }
    } else if (commandName === 'shutdown') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply('You do not have permissions to use this command.');
        }

        await interaction.reply('Shutting down...');
        client.destroy();
        console.log('Bot is offline.');
    } else if (commandName === 'nuke') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply('You do not have permissions to use this command.');
        }

        const channel = interaction.channel;

        await interaction.reply('Nuking this channel...');

        const position = channel.position;
        const newChannel = await channel.clone();
        await newChannel.setPosition(position);
        await channel.delete();

        await newChannel.send('This channel has been nuked!');
    
    }
});

// Login to Discord with your app's token
client.login(token);
