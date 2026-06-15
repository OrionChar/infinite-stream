import LipSync from "../lip-sync.js";
import Stage from "./stage.js";
import { LipSyncInput, LipSyncOutput } from "./types.js";

export default class LipSyncStage extends Stage<LipSyncInput, LipSyncOutput> {
    protected name: string = 'Lip Sync';
    private lipSync: LipSync = new LipSync()

    protected setup(): Promise<unknown> {
        return new Promise(() => { })
    }

    protected async processTask(payload: LipSyncInput): Promise<LipSyncOutput> {
        const result = await this.lipSync.run({
            script: payload.script,
            audioFilepath: payload.audioFilepath
        })

        if (result.isErr()) {
            throw result.error
        }

        return {
            ...payload,
            lipSync: result.value
        }
    }
}
