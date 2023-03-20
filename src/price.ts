import { EventEmitter } from "events";
import { GptModel } from "./type/gpt";

const calcPrice = (model: GptModel, prompt: number, completion: number) => {
    switch (model) {
        case "gpt-3.5-turbo":
        case "gpt-3.5-turbo-0301":
            return (prompt + completion) * 0.000002;
        case "gpt-4":
        case "gpt-4-0314":
            return (prompt * 0.00003) + (completion * 0.00006);
        case "gpt-4-32k":
        case "gpt-4-32k-0314":
            return (prompt * 0.00006) + (completion * 0.00012);
        default:
            return 0;
    }
};

class GptTokenPriceManager extends EventEmitter {
    private static readonly singleton = new GptTokenPriceManager();

    private constructor() {
        super();
    }

    public static get instance() {
        return this.singleton;
    }

    private currentPrice = 0;

    public addPrice(price: number) {
        this.currentPrice += price;
        this.emit("PRICE_ADD", this.currentPrice);
    }

    public resetPrice() {
        this.currentPrice = 0;
        this.emit("PRICE_RESET");
    }

    public get price() {
        return this.currentPrice;
    }

    public get roundedPrice() {
        return this.price.toFixed(4);
    }
}

export {
    calcPrice, GptTokenPriceManager
};
