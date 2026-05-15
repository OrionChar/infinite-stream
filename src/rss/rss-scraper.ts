import Article from "../data-models/article.js";
import Parser from 'rss-parser';

export default class RSSScraper {
    private previousGUID: string = ''

    constructor(private feedEndpoint: URL) {}

    async checkUpdates(): Promise<Article[]> {
        const parser = new Parser<RSSFeed, RSSItem>({
            customFields: {
                item: [
                    "dc:creator",
                    "content:encoded",
                    "media:thumbnail",
                    // ['content:encoded', 'content', { includeSnippet: true }]
                ],
            }
        });
        const articles: Article[] = []
        const feed = await parser.parseURL(this.feedEndpoint.toString());


        for (const rssItem of feed.items) {
            if (rssItem.guid === this.previousGUID) {
                break
            }

            const article = {
                guid: rssItem.guid,
                title: rssItem.title,
                content: rssItem["content:encodedSnippet"],
                link: rssItem.link,
            }

            articles.push(article)
        }

        const theLatestArticleGUIDOfCurrentUpdate = feed.items[0].guid
        this.previousGUID = theLatestArticleGUIDOfCurrentUpdate

        return articles
    }
}

type RSSItem = {
    'title': string,
    'link': string,
    'description': string,
    'pubDate': string,
    'guid': string,
    'content:encoded': string,
    // 'media:content': string, // A tag without data <media:content width="" height="" type="" url="" />
    'media:thumbnail': string,
    'dc:creator': string,
    'content:encodedSnippet': string
}

type RSSFeed = {
    'title': string,
    'link': string,
    'description': string,
    'copyright': string,
}

