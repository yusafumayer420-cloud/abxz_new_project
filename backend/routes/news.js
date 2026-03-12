const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');
const parser = new Parser();

const NEWS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' }
];

let newsCache = {
  data: [],
  lastFetched: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get crypto news
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (newsCache.data.length > 0 && (now - newsCache.lastFetched) < CACHE_DURATION) {
      return res.json(newsCache.data);
    }

    const feedPromises = NEWS_FEEDS.map(feed => 
      parser.parseURL(feed.url).catch(err => {
        console.error(`Error fetching ${feed.name}:`, err.message);
        return { items: [] };
      })
    );

    const feeds = await Promise.all(feedPromises);
    let allItems = [];

    feeds.forEach((feed, index) => {
      const sourceName = NEWS_FEEDS[index].name;
      const items = feed.items.map(item => ({
        id: item.guid || item.link,
        title: item.title,
        summary: item.contentSnippet || item.summary || '',
        content: item.content || '',
        source: sourceName,
        date: item.pubDate || item.isoDate,
        link: item.link,
        image: item.enclosure?.url || '', // RSS images are often in enclosures
        category: item.categories ? item.categories[0] : 'Crypto'
      }));
      allItems = [...allItems, ...items];
    });

    // Sort by date descending
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to 50 items
    newsCache.data = allItems.slice(0, 50);
    newsCache.lastFetched = now;

    res.json(newsCache.data);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    if (newsCache.data.length === 0) {
      // Re-fetch if cache is empty
      const response = await axios.get(`${req.protocol}://${req.get('host')}/api/news`);
      // The recursive call is tricky, let's just use the cache if available
    }

    const filtered = newsCache.data.filter(item => 
      item.category?.toLowerCase() === category.toLowerCase() ||
      item.title?.toLowerCase().includes(category.toLowerCase())
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;