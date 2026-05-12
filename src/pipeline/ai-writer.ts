import { LMStudioClient, Chat, LLM, PredictionResult } from "@lmstudio/sdk";
import PipelineNode from "./pipeline-node.js";
import { ok, err, Result } from "neverthrow";

/**
 * Actually it is not PipelineNode. 
 * I would call it IntelligentService, but at the current time 
 * I do no see different PipelineNode vs IntelligentService
 */
class AIWriter implements PipelineNode<string, string> {
    constructor(address: string, port: number | string) {
        this.client = new LMStudioClient({ baseUrl: `ws://${address}:${port}` });
    }
    async run(prompt: string): Promise<Result<string, unknown>> {
        try {
            return ok((await this.process(prompt)).content)
        } catch (error) {
            return err(error)
        }
    }


    private model: LLM | null = null
    private isInited: boolean = false;
    private client: LMStudioClient

    async start(): Promise<void> {
        const modelIdentifier = "models/Mistral";

        this.model = await this.client.llm.load(modelIdentifier, {
            config: { contextLength: 8192 },
        });

        this.isInited = true
    }

    async stop(): Promise<void> {
        if (!this.isInited) {
            await this.model.unload();
            this.isInited = false;
        }
    }

    private async process(text: string): Promise<PredictionResult> {
        const chatResponse = await Chat.from([
            {
                role: "user",
                content: `You are a super charismatic streamer. You are reading deferent news. Your task is to read and give detailed comments on news articles. DO NOT greet and do not direct appeals to the audience. Your speech should be emotional and lively. If this is true in the context of the news, then You can joke, swear and show all sorts of emotions. The tone of your speech should be friendly, as if you were talking to your closest friend.
                    Try to include the key parts of the article in your speech, trying to cover at least 60% of the main text. Before you start, you should read the title, if there is one, or compose it yourself. If the title is too big, you need to shorten it.`
            },
            {
                role: 'user',
                content: text
            }
        ]);

        return this.model.respond(chatResponse)
    }
}

export default AIWriter