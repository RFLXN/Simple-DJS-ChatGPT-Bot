import {
    ChatInputCommandInteraction, REST, Routes, SlashCommandBuilder, SlashCommandStringOption
} from "discord.js";
import { GptTokenPriceManager } from "./price.js";
import { GptModels } from "./type/gpt.js";
import { getModel, setModel as setGptModel } from "./gpt.js";

const resetUsed = new SlashCommandBuilder()
    .setName("reset-used")
    .setDescription("Reset Current Used");

const isOwner = (interaction: ChatInputCommandInteraction) => {
    const ownerId = process.env.DISCORD_BOT_OWNER_ID as string;

    return interaction.user.id == ownerId;
};

const doResetUsed = async (interaction: ChatInputCommandInteraction) => {
    if (!isOwner(interaction)) {
        await interaction.reply("This Command is Only for Bot Administrator!");
        return;
    }

    GptTokenPriceManager.instance.resetPrice();

    await interaction.reply("Current Used Reset!");
};

const setModel = new SlashCommandBuilder()
    .setName("model")
    .setDescription("Set ChatGPT Model");

const modelOption = new SlashCommandStringOption()
    .setName("model")
    .setDescription("ChatGPT Model Name")
    .setRequired(true);

for (const model of GptModels) {
    modelOption.addChoices({
        name: model,
        value: model
    });
}

setModel.addStringOption(modelOption);

const doSetModel = async (interaction: ChatInputCommandInteraction) => {
    if (!isOwner(interaction)) {
        await interaction.reply("This Command is Only for Bot Administrator!");
        return;
    }

    const modelName = interaction.options.getString("model", true);
    setGptModel(modelName);

    await interaction.reply(`Model Set: ${getModel()}`);
};

const index = [resetUsed, setModel];

const handlers: Record<string, (interaction: ChatInputCommandInteraction) => void> = {
    "reset-used": doResetUsed,
    model: doSetModel
};

const registerCommands = async (rest: REST, applicationId: string, commands: SlashCommandBuilder[]) => {
    await rest.put(Routes.applicationCommands(applicationId), {
        body: commands
    });
};

export { index, handlers, registerCommands };
