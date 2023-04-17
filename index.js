const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Configuration, OpenAIApi } = require('openai');
const client = new Discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildMembers",
        "GuildIntegrations",
        "GuildMessageReactions",
        "GuildPresences",
        "GuildMessageTyping",
        "GuildModeration",
        "GuildEmojisAndStickers",
        "AutoModerationConfiguration",
        "AutoModerationExecution",
        "GuildModeration"
    ],
});
const { apiKey1, botToken, applicationId, guildId } = require('./settings.json');
const configuration = new Configuration({
  apiKey: apiKey1,
});
const openai = new OpenAIApi(configuration);
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { ChannelType } = require('discord.js');

// Registra los comandos globales de Discord
const commands = [
  new SlashCommandBuilder()
    .setName('creardialogo')
    .setDescription('Crea un dialogo privado para discutir sobre un tema específico')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('El nombre del dialogo a crear')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('borrardialogo')
    .setDescription('Borra un dialogo privado que hayas creado')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('El nombre del dialogo a borrar')
        .setRequired(true)),
];

// Inicializa el objeto REST
const rest = new REST({ version: '9' }).setToken(botToken);

(async () => {
  try {
    console.log('Empezando a registrar comandos en Discord');

    await rest.put(
      Routes.applicationGuildCommands(applicationId, guildId),
      { body: commands.map(command => command.toJSON()) },
    );

    console.log('Comandos registrados exitosamente en Discord');
  } catch (error) {
    console.error(error);
  }
})();

client.once(Discord.Events.ClientReady, c => {
  console.log(`BOT ready to use! `);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  //if (msg.channel.id !== msg.channelId) return;
  if (msg.content.startsWith('!')) return;

  let conversationLog = [{ role: 'system', content: 'Eres un bot amigable.' }]; // You are a friendly chatbot.
//Eres un amigable chatbot. Saluda a la persona con la que estas hablando al empezar la conversación solo una vez y continua con lo que te pide. Recalca cada que inicies una conversación, avises tus ultimos datos recopilados, para que avises que estas limitado a responder cosas o eventos antes del 2020 solo una vez en la conversación para que despues continues con lo que te vaya diciendo.
  await msg.channel.sendTyping();

  let prevMessages = await msg.channel.messages.fetch({ limit: 15 });
  prevMessages.reverse();

  prevMessages.forEach((mnsg) => {
    if (msg.content.startsWith('!')) return;
    if (mnsg.author.id !== client.user.id && msg.author.bot) return;
    if (mnsg.author.id !== msg.author.id) return;

    conversationLog.push({
      role: 'user',
      content: mnsg.content,
    });
  });

  if (msg.mentions.users.first()) { // if (msg.content.includes(`@${client.user.username}`))
    //const prompt = msg.content.replace(`@${client.user.username}`, '');
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      //prompt: prompt,
      messages: conversationLog,
      //temperature: 0.7,
      //max_tokens: 256,
      //top_p: 1,
      //frequency_penalty: 0,
      //presence_penalty: 0,
      //stop: ["\"\"\""],
    });
    msg.reply(response.data.choices[0].message);
    //msg.channel.send(response.data.choices[0].text);
  }
});

client.on('interactionCreate', async (interaction) => {
    //const input = interaction.options.getString('input');

    if (interaction.isCommand() && interaction.commandName === 'creardialogo') {
      const thread = await interaction.channel.threads.create({
        name: `Dialogo de ${interaction.user.username}`,
        autoArchiveDuration: 1440,
        type: ChannelType.PublicThread,
      });
      
      // Establecer el tema del hilo como el mensaje que inició el hilo
      //const initialMessage = interaction.options.get('mensaje').value;
      //await thread.setTopic(`Discusión sobre: ${initialMessage}`);
  
      interaction.reply(`Chat creado en ${thread}`);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'borrardialogo') {
      const { options } = interaction;
      const threadName = options.getString('nombre');
      const threadChannel = interaction.guild.channels.cache.find(channel => channel.name === threadName && channel.isThread());
      if (!threadChannel) { 
        return interaction.reply(`No se encontró ningún hilo con el nombre "${threadName}".`);
      } else {
      const confirmationMessage = await threadChannel.send(`¿Seguro quieres borrar este dialogo, ${interaction.user.username}?`);
      await confirmationMessage.react('👍');
      await confirmationMessage.react('👎');
      const collector = confirmationMessage.createReactionCollector(
        (reaction, user) =>
          ['👍', '👎'].includes(reaction.emoji.name) &&
          user.id === interaction.user.id && !interaction.user.bot,
          { max: 1, time: 10000 }
      );
      collector.on('collect', async (reaction) => {
        if (reaction.emoji.name === '👍') {
            await threadChannel.delete();
            await interaction.reply(`El dialogo de ${interaction.user.username} ha sido eliminado`);
          } else {
            await interaction.reply(`El dialogo de ${interaction.user.username} no ha sido eliminado`);
          }
        }
      );
    }
  }
});

client.login(botToken);
