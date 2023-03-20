const GptModels = [
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-32k",
    "gpt-4-32k-0314",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301"
];

type GptModel = (typeof GptModels)[number];

interface ChatCreateResult {
    model: GptModel;
    result: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    price: number;
}

export { GptModel, GptModels, ChatCreateResult };
