import WritingStage from "./stages/writing-stage.js"
import DubbingStage from "./stages/dubbing-stage.js"
import RenderingStage from "./stages/rendering-stage.js"
import LipSyncStage from "./stages/lip-sync-stage.js"
import ScrapingStage from "./stages/scraping-stage.js"
import PipelineLogger from "./pipeline-logger.js"

export default class Pipeline {
    private scrapingStage = new ScrapingStage()
    private writingStage = new WritingStage();
    private dubbingStage = new DubbingStage();
    private lipSyncStage = new LipSyncStage();
    private rendingStage = new RenderingStage();

    private logger = new PipelineLogger()

    async start() {
        await this.writingStage.init()
        setInterval(() => { this.scrapingStage.scheduleTask(null) }, 60 * 1000)

        this.scrapingStage.on('task:complete', (_stageName, payloads) => payloads.forEach(payload => this.writingStage.scheduleTask(payload)))
        this.writingStage.on('task:complete', (_stageName, payload) => this.dubbingStage.scheduleTask(payload))
        this.dubbingStage.on('task:complete', (_stageName, payload) => this.lipSyncStage.scheduleTask(payload))
        this.lipSyncStage.on('task:complete', (_stageName, payload) => this.rendingStage.scheduleTask(payload))



        this.logger.log(
            this.scrapingStage,
            this.writingStage,
            this.dubbingStage,
            this.lipSyncStage,
            this.rendingStage,
        )
    }
}

