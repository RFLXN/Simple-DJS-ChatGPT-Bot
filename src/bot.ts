import {
    Client, IntentsBitField, Message, TextChannel
} from "discord.js";

type InitializedClient = Client<true>;
const initBot = async (token: string) => {
    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent
        ]
    });

    await client.login(token);

    return client as InitializedClient;
};

const fetchReplies = async (message: Message) => {
    const messages: Message[] = [];

    let originMessage = message;

    while (originMessage.reference) {
        const repliedMessageId = originMessage.reference.messageId as string;

        const repliedMessage = await (message.channel as TextChannel).messages.fetch(repliedMessageId);
        messages.push(repliedMessage);
        originMessage = repliedMessage;
    }

    return messages;
};

const replaceMentionToName = (message: Message, filterSelf: boolean) => {
    let rawMessage = message.content;
    if (filterSelf) {
        rawMessage = rawMessage.replace(`<@${message.client.user.id}>`, "");
        rawMessage = rawMessage.replaceAll(`<@${message.client.user.id}>`, "ChatGPT");

        message.mentions.users.filter((user) => user.id != message.client.user.id).map((user) => {
            rawMessage = rawMessage.replaceAll(`<@${user.id}>`, user.username);
        });
    } else {
        message.mentions.users.map((user) => {
            rawMessage = rawMessage.replaceAll(`<@${user.id}>`, user.username);
        });
    }

    return rawMessage;
};

const setBotHandlers = (bot: InitializedClient) => {
    bot.on("messageCreate", async (message: Message) => {
        if (message.author.bot) return;
        if (!message.mentions.has(bot.user.id)) return;

        const rawMentionToNamedMessage = message.content.replace(`<@${bot.user.id}>`, "");

        message.mentions.users
            .filter((user) => user.id != bot.user.id)
            .map((user) => {
                rawMentionToNamedMessage.replaceAll(`<@${user.id}>`, user.username);
            });
    });
};

export {
    initBot, setBotHandlers, replaceMentionToName, fetchReplies
};
