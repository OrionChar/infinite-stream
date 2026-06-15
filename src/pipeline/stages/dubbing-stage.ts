import path from "path";
import convertFlacToOgg from "../../utils/convert-flac-to-ogg.js";
import AIAnnouncer from "../ai-announcer.js";
import FileManipulator from "../../utils/file-manipulator.js";
import { DubbingInput, DubbingOutput } from "./types.js";
import Stage from "./stage.js";

export default class DubbingStage extends Stage<DubbingInput, DubbingOutput> {
    protected name: string = 'Dubbing'

    constructor() {
        super();
        this.aiAnnouncer = new AIAnnouncer(process.env.COMFYUI_HOST, process.env.COMFYUI_HOST_PORT);
    }

    private aiAnnouncer: AIAnnouncer

    protected setup(): Promise<void> { return new Promise(() => { }) }

    protected async processTask(payload: DubbingInput): Promise<DubbingOutput> {
        const result = await this.aiAnnouncer.run(payload.script)

        if (result.isErr()) {
            throw result.error
        }

        const audioFilepath = await this.saveAsFile(payload.id, result.value)

        return {
            ...payload,
            audioFilepath: audioFilepath
        }
    }


    private async saveAsFile(id: string, audio: Buffer<ArrayBuffer>) {
        const fileManipulator = new FileManipulator()
        const flacAudioFilePath = path.join(process.env.AUDIO_STORAGE, `${id}.flac`)

        const creatingResult = await fileManipulator.createFile(flacAudioFilePath, audio)

        if (creatingResult.isErr()) {
            throw creatingResult.error
        }

        await convertFlacToOgg(flacAudioFilePath)

        const deletingResult = await fileManipulator.deleteFile(flacAudioFilePath)

        if (deletingResult.isErr()) {
            throw deletingResult.error
        }

        return path.join(process.env.AUDIO_STORAGE, `${id}.ogg`)
    }
}

