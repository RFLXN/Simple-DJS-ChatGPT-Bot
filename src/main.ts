import { config } from "dotenv";
import {
    EmbedBuilder, Interaction, REST, TextChannel
} from "discord.js";
import { fetchReplies, initBot, replaceMentionToName } from "./bot";
import {
    convertToMessageObject,
    createChatCompletion,
    createGptClient,
    createGptConfig,
    createResultPricingMessage,
    getModel,
    setModel
} from "./gpt";
import { GptTokenPriceManager } from "./price";
import { GptModel } from "./type/gpt";
import { handlers, index, registerCommands } from "./bot-commands";

config();

const {
    GPT_MODEL, OPENAI_API_KEY, DISCORD_BOT_KEY, DISCORD_BOT_OWNER_ID
} = process.env;

if (!OPENAI_API_KEY || !GPT_MODEL || !DISCORD_BOT_KEY || !DISCORD_BOT_OWNER_ID) {
    console.error("Invalid Configuration.");
    process.exit(1);
}

setModel(process.env.GPT_MODEL as GptModel);

const bot = await initBot(DISCORD_BOT_KEY);
const rest = new REST();

const gpt = createGptClient(createGptConfig(OPENAI_API_KEY));
const priceManager = GptTokenPriceManager.instance;

rest.setToken(DISCORD_BOT_KEY);

bot.on("ready", async () => {
    console.log(`Bot Logged in as ${bot.user.tag}`);
    console.log(`Registering Commands: ${index.map((cmd) => cmd.name)}`);
    await registerCommands(rest, bot.application.id, index);
});

bot.on("messageCreate", async (message) => {
    try {
        if (message.author.bot) return;
        if (!message.mentions.has(bot.user.id)) return;

        console.log(`Received Chat in Channel '${message.channel.id}'`);
        console.log("Content:");
        console.log(message.content);

        const channel = message.channel as TextChannel;

        await channel.sendTyping();

        const messages = [message].concat(await fetchReplies(message))
            .map((msg) => replaceMentionToName(msg, true)).reverse();

        const converted = convertToMessageObject(messages);

        const result = await createChatCompletion(
            gpt,
            getModel(),
            converted,
            1024,
            message.author.id
        );

        priceManager.addPrice(result.price);

        console.log(`Send Reply in Channel '${message.channel.id}'`);
        console.log("Content:");
        console.log(result.result);
        console.log(createResultPricingMessage(result, priceManager.price));

        await message.reply({
            content: `${result.result}`,
            embeds: [new EmbedBuilder().setDescription(createResultPricingMessage(result, priceManager.roundedPrice))]
        });
    } catch (e) {
        console.error(e);
        await message.reply(`ERROR OCCURRED!\n${e}`);
    }
});

bot.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const targetCommandHandler = handlers[interaction.commandName];

        if (targetCommandHandler) {
            await targetCommandHandler(interaction);
        }
    }
});

const setActivity = () => {
    bot.user.setActivity(`Current Used $${priceManager.roundedPrice}`);
};

priceManager.on("PRICE_ADD", setActivity);
priceManager.on("PRICE_RESET", setActivity);
