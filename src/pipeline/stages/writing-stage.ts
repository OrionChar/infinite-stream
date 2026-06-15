import path from "path";
import AIWriter from "../ai-writer.js";
import Stage from "./stage.js";
import FileManipulator from "../../utils/file-manipulator.js";
import { WritingInput, WritingOutput, ScraperOutput } from "./types.js";

export default class WritingStage extends Stage<WritingInput, WritingOutput> {
    protected name: string = 'Writing'


    constructor() {
        super();
        this.aiWriter = new AIWriter(process.env.LLM_STUDIO_HOST, process.env.LLM_STUDIO_PORT);
    }

    private aiWriter: AIWriter

    protected async setup() {
        //TODO Remove the setup method
        await this.aiWriter.start()
    }

    protected async processTask(payload: ScraperOutput): Promise<WritingOutput> {
        const prompt = `TITLE\n${payload.article.title}\n\nMAIN CONTENT\n${payload.article.content}`;
        const inferenceResult = await this.aiWriter.run(prompt)

        if (inferenceResult.isErr()) {
            throw inferenceResult.error
        }

        const fileSavingResult = await this.saveScriptAsFile(payload.id, inferenceResult.value)

        if (fileSavingResult.isErr()) {
            throw fileSavingResult.error
        }

        return {
            ...payload,
            scriptFilepath: fileSavingResult.value,
            script: inferenceResult.value
        }
    }

    private async saveScriptAsFile(id: string, script: string) {
        const fileManipulator = new FileManipulator()
        const storageLocation = process.env.SCRIPT_STORAGE
        const filePath = path.join(storageLocation, `${id}.txt`)

        return await fileManipulator.createFile(filePath, script)
    }
}

