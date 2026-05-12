import Article from "../../data-models/article.js";

export default abstract class IRSSScraper {
    constructor(protected feedEndpoint: URL) {}
    protected previousGUID: string = ''

    abstract checkUpdates(): Promise<Article[]>
}