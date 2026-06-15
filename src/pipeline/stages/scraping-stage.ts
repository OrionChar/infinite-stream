import path from "path";
import FileManipulator from "../../utils/file-manipulator.js";
import Stage from "./stage.js";
import { ScraperOutput } from "./types.js";
import Scraper from "../../rss/scraper.js";
import Article from "../../data-models/article.js";

export default class ScrapingStage extends Stage<null, ScraperOutput[]> {
    protected setup(): Promise<unknown> { return null }
    protected name: string = 'Scraper'

    constructor() {
        super();
        this.scrapper = new Scraper();
    }

    private scrapper: Scraper


    protected async processTask(): Promise<ScraperOutput[]> {
        const feeds = await this.scrapper.checkUpdates()
        const result: ScraperOutput[] = [];

        for (const articles of feeds) {
            if (articles.length > 0) {
                for (const article of articles) {
                    result.push({ id: article.guid, article })
                    await this.saveAsFile(article)
                }
            }
        }

        return result
    }

    private async saveAsFile(article: Article) {
        const fileManipulator = new FileManipulator()

        fileManipulator.createFile(
            path.join(process.env.ARTICLE_STORAGE, `${article.guid}.json`),
            JSON.stringify(article)
        )
    }
}

