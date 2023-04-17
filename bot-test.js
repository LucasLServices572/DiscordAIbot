//in bot.js

const { ask } = require("./ai-test.js"); //import the "ask" function from the "ai.js" file
const { Client, Events, GatewayIntentBits } = require('discord.js'); //v14.6.0
const token = "MTA5MDQ4MzY1Nzc3ODY1OTQ4OQ.GMBsQg.U8B5DdpJ7k6FRqfAJtqqO3gm9qPGiOzCRt6JQU";

// Create a new client instance
const client = new Client({
  intents:
    [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent]
});

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.content.substring(0, 1) === "!") {
    const prompt = message.content.substring(1); //remove the exclamation mark from the message
    const answer = await ask(prompt); //prompt GPT-3
    client.channels.fetch(message.channelId).then(channel => channel.send(answer));
  }
});

// Log in to Discord with your client's token
client.login(token);