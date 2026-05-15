import Article from "../data-models/article.js";
import RSSScraper from "./rss-scraper.js";

export default class Scraper {
	private scrapers: RSSScraper[] = [
		new RSSScraper(new URL('https://feeds.feedburner.com/ign/games-all')),
		new RSSScraper(new URL('https://rss.politico.com/politics-news.xml')),
		//https://phys.org/feeds/,
		//https://www.geekwire.com/feed/',
	]

	checkUpdates(): Promise<Article[][]> {
		return Promise.all(this.scrapers.map(scraper => scraper.checkUpdates()))
	}
}
