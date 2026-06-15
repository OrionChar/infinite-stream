import Renderer from "../renderer.js";
import Stage from "./stage.js";
import { RenderingInput, RenderingOutput } from "./types.js";

export default class RenderingStage extends Stage<RenderingInput, RenderingOutput> {
    protected name: string = 'Rendering'

    private renderer: Renderer = new Renderer(`${process.env.STREAMING_RTMP_SERVER}/${process.env.STREAMING_RTMP_KEY}`);

    protected setup(): Promise<void> { return new Promise(() => { }) }

    protected async processTask(payload: RenderingInput): Promise<RenderingOutput> {
        const result = await this.renderer.run({
            lipSync: payload.lipSync,
            audioLocation: payload.audioFilepath
        })

        if (result.isErr()) {
            throw result.error
        }

        return payload
    }
}
