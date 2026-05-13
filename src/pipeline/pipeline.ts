import path from "path"
import FileManipulator from "../utils/file-manipulator.js"
import RSSScraper from "../rss/rss-scraper.js"
import PipelineStage, { DubbingStage, RenderingStage, StreamingStage, WritingStage } from "./pipiline-stage.js"
import PipelineLogger from "./pipeline-logger.js"

export default class Pipeline {
    private stages: PipelineStage<unknown>[] = [
        new WritingStage(process.env.LLM_STUDIO_HOST, process.env.LLM_STUDIO_PORT, process.env.ARTICLE_STORAGE),
        new DubbingStage(process.env.COMFYUI_HOST, process.env.COMFYUI_HOST_PORT, process.env.SCRIPT_STORAGE),
        new RenderingStage(process.env.TEMPORAL_STORAGE, process.env.AUDIO_STORAGE),
        new StreamingStage(process.env.STREAMING_RTMP_SERVER, process.env.STREAMING_RTMP_KEY, process.env.VIDEO_STORAGE),
    ]

    private logger = new PipelineLogger()

    async start() {
        this.stages.forEach(stage => {
            stage.init();
            this.logger.log(stage)
        })
        this.listenUpdates()
    }

    private fileManipulator = new FileManipulator()
    private scrapper = new RSSScraper()

    private listenUpdates() {
        setInterval(async () => {
            const feeds = await this.scrapper.checkUpdates()

            try {
                for (const articles of feeds) {
                    if (articles.length > 0) {
                        for (const article of articles) {
                            await this.fileManipulator.createFile(
                                path.join(process.env.ARTICLE_STORAGE, `${article.guid}.json`),
                                JSON.stringify(article)
                            )
                        }
                    }
                }
            } catch (error) {
                console.error(error)
            }
        }, 60 * 1000)
    }
}

