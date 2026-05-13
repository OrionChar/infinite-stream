import EventEmitter from "events";
import AIWriter from "./ai-writer.js";
import fastq from "fastq";
import { FileName, FilePath } from "../types/alias.js";
import Article from "../data-models/article.js";
import FileManipulator from "../utils/file-manipulator.js";
import path from "path";
import StorageWatcher from "../utils/storage-watcher.js";
import AIAnnouncer from "./ai-announcer.js";
import convertFlacToOgg from "../utils/convert-flac-to-ogg.js";
import Renderer from "./renderer.js";
import Streamer from "./streamer.js";

interface PipelineStageEvents {
    'storage:error': [unknown],

    'task:start': [
        stageName: string,
        payload: StagePayload<unknown>
    ],
    'task:progress': [number],
    'task:complete': [
        stageName: string,
        payload: StagePayload<unknown>
    ],
    'task:error': [unknown],
}

export default abstract class PipelineStage<DATA> extends EventEmitter<PipelineStageEvents> {
    constructor(storagePath: string) {
        super()
        this.storage = new StorageWatcher(storagePath)
    }

    init() {
        this.setup()
        this.monitorStorage()
    }

    private monitorStorage() {
        this.storage.on('create', async (filepath, filename) => {
            try {
                const payload = await this.processStorageUpdate(filepath, filename)
                this.queueTasks.push(payload)
            } catch (error) {
                this.emit('storage:error', error)
            }
        })
    }

    private async processStage(payload: StagePayload<unknown>) {
        try {
            this.emit('task:start', this.name, payload)
            await this.processTask(payload)
            this.emit('task:complete', this.name, payload)
        } catch(error) {
            this.emit('task:error', error)
        }
    }

    private queueTasks = fastq.promise<PipelineStage<DATA>, StagePayload<DATA>>(this, this.processStage, 1)
    private storage: StorageWatcher;

    protected fileManipulator = new FileManipulator()

    protected abstract name: string
    protected abstract setup(): Promise<unknown>
    protected abstract processStorageUpdate(filepath: FilePath, filename: FileName): Promise<StagePayload<DATA>>
    protected abstract processTask(payload: StagePayload<unknown>): Promise<void>
}

export class WritingStage extends PipelineStage<Article> {
    protected name: string = 'Writing'

    constructor(host: string, port: string, storagePath: string) {
        super(storagePath);
        this.aiWriter = new AIWriter(host, port);
    }

    private aiWriter: AIWriter

    protected async setup() {
        await this.aiWriter.start()
    }

    protected async processStorageUpdate(articleFilepath: FilePath): Promise<StagePayload<Article>> {
        const readingResult = await this.fileManipulator.readJSON<Article>(articleFilepath)

        if (readingResult.isOk()) {
            return { data: readingResult.value, location: articleFilepath }
        } else {
            throw readingResult.error
        }
    }

    protected async processTask(payload: StagePayload<Article>): Promise<void> {
        const result = await this.aiWriter.run(`TITLE\n${payload.data.title}\n\nMAIN CONTENT\n${payload.data.content}`)

        if (result.isErr()) {
            throw result.error
        }

        const creatingResult = await this.fileManipulator.createFile(path.join(process.env.SCRIPT_STORAGE, `${payload.data.guid}.txt`), result.value)

        if (creatingResult.isErr()) {
            throw creatingResult.error
        }
    }
}

export class DubbingStage extends PipelineStage<string> {
    protected name: string = 'Dubbing'

    constructor(host: string, port: string, storagePath: string) {
        super(storagePath);
        this.aiAnnouncer = new AIAnnouncer(host, port);
    }

    private aiAnnouncer: AIAnnouncer

    protected setup(): Promise<void> { return new Promise(() => { }) }

    protected async processStorageUpdate(scriptFilepath: FilePath): Promise<StagePayload<string>> {
        const readingResult = await this.fileManipulator.readFile(scriptFilepath)

        if (readingResult.isOk()) {
            return { data: readingResult.value, location: scriptFilepath }
        } else {
            throw readingResult.error
        }
    }

    protected async processTask(payload: StagePayload<string>): Promise<void> {
        const flacAudioFileName = `${path.basename(payload.location, path.extname(payload.location))}.flac`
        const flacAudioFilePath = path.join(process.env.AUDIO_STORAGE, flacAudioFileName)

        const result = await this.aiAnnouncer.run(payload.data)

        if (result.isErr()) {
            throw result.error
        }

        const creatingResult = await this.fileManipulator.createFile(flacAudioFilePath, result.value)

        if (creatingResult.isErr()) {
            throw creatingResult.error
        }

        await convertFlacToOgg(flacAudioFilePath)

        const deletingResult = await this.fileManipulator.deleteFile(flacAudioFilePath)

        if (deletingResult.isErr()) {
            throw deletingResult.error
        }
    }
}

export class RenderingStage extends PipelineStage<string> {
    protected name: string = 'Rendering'

    constructor(private temporalStorage: string, storagePath: string) {
        super(storagePath);
        this.renderer = new Renderer();
    }

    private renderer: Renderer

    protected setup(): Promise<void> { return new Promise(() => { }) }

    protected async processStorageUpdate(audioFilepath: FilePath, audioFilename: FileName): Promise<StagePayload<string>> {
        const supportedFileExtension = '.ogg'

        if (path.extname(audioFilename) === supportedFileExtension) {
            return { data: audioFilename, location: audioFilepath }
        }

        throw new Error(`Extension of the file "${audioFilename}" should be ${supportedFileExtension}. File path: ${audioFilepath}`)
    }

    protected async processTask(payload: StagePayload<string>): Promise<void> {
        const audioFilename = payload.data
        const audioLocation = payload.location

        const videoFileName = `${path.basename(audioFilename, path.extname(audioFilename))}.mkv`
        const videoLocation = path.join(this.temporalStorage, videoFileName)

        const result = await this.renderer.run({sourceAudioLocation: audioLocation, destinationVideoLocation: videoLocation})

        if (result.isErr()) {
            throw result.error
        }

        const movingResult = await this.fileManipulator.moveFile(videoLocation, process.env.VIDEO_STORAGE)

        if (movingResult.isErr()) {
            throw movingResult.error
        }
    }

}

export class StreamingStage extends PipelineStage<null> {
    protected name: string = 'Streaming'

    constructor(host: string, key: string, storagePath: string) {
        super(storagePath);
        this.streamer = new Streamer(host, key);
    }

    private streamer: Streamer

    protected setup(): Promise<void> { return new Promise(() => { }) }

    protected async processStorageUpdate(videoFilepath: FilePath): Promise<StagePayload<null>> {
        return { data: null, location: videoFilepath }
    }
    protected async processTask(payload: StagePayload<null>): Promise<void> {
        const result = await this.streamer.run(payload.location)

        if (result.isErr()) {
            throw result.error
        }
    }
}


type StagePayload<D> = {
    data: D,
    location: FilePath
}