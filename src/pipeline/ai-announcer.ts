import { ComfyApi, CallWrapper, PromptBuilder } from "@saintno/comfyui-sdk";
import TTSWorkflow from "./workflows/text-to-speech.json" with { type: 'json' };
import PipelineNode from "./pipeline-node.js";
import { ok, err, Result } from "neverthrow";
import {  } from "assert";

/**
 * Actually it is not PipelineNode. 
 * I would call it IntelligentService, but at the current time 
 * I do no see different PipelineNode vs IntelligentService
 */
class AIAnnouncer implements PipelineNode<string, Buffer<ArrayBuffer>> {
    private client: ComfyApi
    private host: string

    constructor(address: string, port: number | string) {
        const clientID = 'bot-666';
        this.host = `http://${address}:${port}`
        this.client = new ComfyApi(this.host, clientID, { wsTimeout: 60 * 1000 }).init();
    }

    async run(script: string): Promise<Result<Buffer<ArrayBuffer>, unknown>> {
        try {
            const { filename, subfolder, type } = await this.process(script)
            const binaryAudio = await this.fetchExecutionResult(filename, subfolder, type)
            return ok(binaryAudio)
        } catch (error) {
            return err(error)
        }
    }


    private process(text: string): Promise<ProcessResult> {
        const workflow = new PromptBuilder(TTSWorkflow, ['189'], ['195'])
            .setInputNode('189', '189.inputs.value')
            .input('189', text)
            .setOutputNode('195', '195')

        return new Promise((resolve, reject) => {
            new CallWrapper(this.client, workflow)
                .onStart((promptId) => { console.log('it is started', promptId) })
                .onProgress((info, promptId) => { console.info('onProgress', info, promptId) })
                .onOutput((key, data, promptId) => { console.log('onOutput', key, data, promptId) })
                .onPreview((ev, promptId) => { console.log('onPreview', promptId, ev) })
                .onFailed((error) => { reject(err(error)) })
                .onFinished(async (_data, promptId) => {
                    const history = await this.client.getHistory(promptId)
                    const { filename, subfolder, type } = history.outputs['195']['audio'][0]

                    resolve({
                        filename, subfolder, type
                    })
                })
                .run()
        })
    }

    private async fetchExecutionResult(filename: string, subfolder: string, type: string): Promise<Buffer<ArrayBuffer>> {
        const comfyuiAPIEndpoint = `${this.host}/api/view?filename=${filename}&subfolder=${subfolder}&type=${type}`

        const response = await fetch(comfyuiAPIEndpoint);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer)
    }
}

export default AIAnnouncer 

interface ProcessResult {
    filename: string,
    subfolder: string,
    type: string
}