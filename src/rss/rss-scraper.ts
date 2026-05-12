import Article from "../data-models/article.js";
import IRSSScraper from "./scrapers/i-rss-scraper.js";
import IGNRssScraper from "./scrapers/ign-feed-scraper.js";

export default class RSSScraper {
	private scrapers: IRSSScraper[] = [
		new IGNRssScraper()
	]
	constructor() {}

	checkUpdates(): Promise<Article[][]> {
		return Promise.all(this.scrapers.map(scraper => scraper.checkUpdates()))
	}
}
