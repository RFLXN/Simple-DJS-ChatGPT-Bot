import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { ChatCreateResult, GptModel } from "./type/gpt.js";
import { calcPrice } from "./price.js";

const createGptConfig = (apiKey: string) => new Configuration({ apiKey });

const createGptClient = (config: Configuration) => new OpenAIApi(config);

const convertToMessageObject = (messages: string[]) => {
    const convertedMessages: ChatCompletionRequestMessage[] = [];
    let isUser = true;

    for (const message of messages) {
        if (isUser) {
            convertedMessages.push({
                role: "user",
                content: message
            });
        } else {
            convertedMessages.push({
                role: "assistant",
                content: message
            });
        }
        isUser = !isUser;
    }

    return convertedMessages;
};

const createChatCompletion = async (
    client: OpenAIApi,
    model: GptModel,
    messages: ChatCompletionRequestMessage[],
    maxToken: number,
    userId: string
) => {
    console.log(`Create Chat Completion with Model: ${model}`);
    console.log(messages);

    const response = await client.createChatCompletion({
        model,
        messages,
        max_tokens: maxToken,
        user: userId
    });

    if (response.status != 200) {
        throw new Error(`HTTP Error: Status Code ${response.status}`);
    }

    const { choices, usage } = response.data;
    const promptTokens = usage?.prompt_tokens as number;
    const completionTokens = usage?.completion_tokens as number;
    const price = calcPrice(model, promptTokens, completionTokens);

    return {
        model,
        result: choices[0].message?.content,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        price
    } as ChatCreateResult;
};

const createResultPricingMessage = (result: ChatCreateResult, totalPrice: number | string) => `Model: ${result.model}\n`
        + `Tokens: [Prompt ${result.promptTokens}] + [Completion ${result.completionTokens}] = `
        + `[Total ${result.totalTokens}]\n`
        + `Session Used Price: $${result.price} / Total Used Price: $${totalPrice}`;

let currentModel: GptModel = "gpt-3.5-turbo";

const setModel = (model: GptModel) => {
    currentModel = model;
};

const getModel = () => currentModel;

export {
    createGptConfig, createGptClient, convertToMessageObject, createChatCompletion, createResultPricingMessage,
    setModel, getModel
};
