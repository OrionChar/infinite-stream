import EventEmitter from "events";
import fastq from "fastq";
import { StageEvents, StageInput, StageOutput } from "./types.js";

export default abstract class Stage<INPUT extends StageInput, OUTPUT extends StageOutput> extends EventEmitter<StageEvents<INPUT, OUTPUT>> {
    constructor() {super()}

    init() {
        this.setup()
    }

    scheduleTask(payload: INPUT) {
        this.queueTasks.push(payload)
    }

    private async processStage(payload: INPUT) {
        try {
            this.emit('task:start', this.name, payload)
            const executionTaskResult = await this.processTask(payload)
            this.emit('task:complete', this.name, executionTaskResult)
        } catch(error) {
            this.emit('task:error', error)
        }
    }

    private queueTasks = fastq.promise<Stage<INPUT, OUTPUT>, INPUT>(this, this.processStage, 1)

    protected abstract name: string
    protected abstract setup(): Promise<unknown> //TODO Remove the setup method
    protected abstract processTask(payload: INPUT): Promise<OUTPUT>
}
