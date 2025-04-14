from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
import xmltodict
from bs4 import BeautifulSoup
import random
import time
import threading
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='build', static_url_path='/static')  
CORS(app, resources={r"/api/*": {"origins": ["https://newsjackal-1.onrender.com"]}})  # Enable CORS for all routes

# Cache directory for storing fetched news to reduce API hits
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

# News sources RSS feeds with their respective categories
NEWS_SOURCES = {
    'bbc': {
        'name': 'BBC News',
        'feeds': {
            'general': 'https://feeds.bbci.co.uk/news/rss.xml',
            'business': 'https://feeds.bbci.co.uk/news/business/rss.xml',
            'entertainment': 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
            'health': 'https://feeds.bbci.co.uk/news/health/rss.xml',
            'science': 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
            'sports': 'https://feeds.bbci.co.uk/sport/rss.xml',
            'technology': 'https://feeds.bbci.co.uk/news/technology/rss.xml'
        }
    },
    'cnn': {
        'name': 'CNN',
        'feeds': {
            'general': 'http://rss.cnn.com/rss/edition.rss',
            'business': 'http://rss.cnn.com/rss/money_news_international.rss',
            'entertainment': 'http://rss.cnn.com/rss/edition_entertainment.rss',
            'health': 'http://rss.cnn.com/rss/edition_health.rss',
            'technology': 'http://rss.cnn.com/rss/edition_technology.rss',
            'sports': 'http://rss.cnn.com/rss/edition_sport.rss',
            'travel': 'http://rss.cnn.com/rss/edition_travel.rss'
        }
    },
    'reuters': {
        'name': 'Reuters',
        'feeds': {
            'general': 'https://www.reutersagency.com/feed/',
            'business': 'https://www.reutersagency.com/feed/?best-sectors=business-finance&post_type=best',
            'technology': 'https://www.reutersagency.com/feed/?best-sectors=technology&post_type=best',
            'health': 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&term=health&post_type=best',
            'science': 'https://www.reutersagency.com/feed/?best-sectors=science&post_type=best'
        }
    },
    'nytimes': {
        'name': 'New York Times',
        'feeds': {
            'general': 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
            'business': 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
            'technology': 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
            'health': 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
            'science': 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
            'sports': 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
            'arts': 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml'
        }
    },
    'guardian': {
        'name': 'The Guardian',
        'feeds': {
            'general': 'https://www.theguardian.com/international/rss',
            'business': 'https://www.theguardian.com/uk/business/rss',
            'technology': 'https://www.theguardian.com/uk/technology/rss',
            'science': 'https://www.theguardian.com/science/rss',
            'sports': 'https://www.theguardian.com/uk/sport/rss',
            'culture': 'https://www.theguardian.com/uk/culture/rss'
        }
    }
}

# Default fallback images for when RSS doesn't provide one
FALLBACK_IMAGES = [
    "https://wallpapercave.com/wp/wp7939960.jpg",
    "https://static.vecteezy.com/system/resources/thumbnails/004/216/831/original/3d-world-news-background-loop-free-video.jpg",
    "https://ichef.bbci.co.uk/images/ic/1200x675/p0fd863k.jpg",
    "https://img.freepik.com/premium-photo/world-news-background-blue-earth-globe-with-glowing-news-icons-headlines-3d-rendering_494747-6195.jpg"
]

# News cache with expiration
news_cache = {}
cache_lock = threading.Lock()
CACHE_EXPIRATION = 15 * 60  # 15 minutes in seconds


@app.route('/api/health')
def health():
    return jsonify({"status": "ok"}), 200


@app.route('/api/sources')
def get_sources():
    """Return list of available news sources"""
    sources = []
    for source_id, source_info in NEWS_SOURCES.items():
        sources.append({
            'id': source_id,
            'name': source_info['name'],
            'categories': list(source_info['feeds'].keys())
        })
    return jsonify(sources)


@app.route('/api/top-headlines')
def top_headlines():
    """Get headlines from one or multiple sources, with category filtering"""
    category = request.args.get('category', 'general').lower()
    source = request.args.get('source', '')  # Optional source filter
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 9))

    try:
        # Determine which sources to fetch from
        sources_to_fetch = []
        if source and source in NEWS_SOURCES:
            # Fetch from specific source if requested
            sources_to_fetch = [source]
        else:
            # Otherwise fetch from all sources
            sources_to_fetch = list(NEWS_SOURCES.keys())

        all_articles = []

        # Try to get from cache first
        cache_key = f"{'-'.join(sources_to_fetch)}-{category}"
        cached_data = get_from_cache(cache_key)

        if cached_data:
            print(f"Using cached data for {cache_key}")
            all_articles = cached_data
        else:
            # Fetch from each source
            for source_id in sources_to_fetch:
                source_info = NEWS_SOURCES.get(source_id)
                if not source_info:
                    continue

                # Get the appropriate feed URL for this category
                if category in source_info['feeds']:
                    feed_url = source_info['feeds'][category]
                elif 'general' in source_info['feeds']:
                    # Fallback to general if specific category not available
                    feed_url = source_info['feeds']['general']
                else:
                    # Skip if no appropriate feed
                    continue

                try:
                    # Fetch and parse the RSS feed
                    articles = fetch_articles_from_rss(feed_url, source_id, source_info['name'])
                    all_articles.extend(articles)
                except Exception as e:
                    print(f"Error fetching from {source_id}: {str(e)}")
                    continue

            # Sort articles by date (newest first)
            all_articles.sort(key=lambda x: x.get('publishedAt', ''), reverse=True)

            # Cache the results
            save_to_cache(cache_key, all_articles)

        # Apply pagination
        total_results = len(all_articles)
        start_idx = (page - 1) * page_size
        end_idx = min(start_idx + page_size, total_results)
        paginated_articles = all_articles[start_idx:end_idx]

        return jsonify({
            "status": "ok",
            "totalResults": total_results,
            "articles": paginated_articles
        })

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


def fetch_articles_from_rss(feed_url, source_id, source_name):
    """Fetch and parse articles from a given RSS feed URL"""
    print(f"Fetching RSS feed from: {feed_url}")

    response = requests.get(feed_url, timeout=10)
    data = xmltodict.parse(response.content)

    # Handle different RSS structures
    if 'rss' in data and 'channel' in data['rss']:
        articles = data['rss']['channel'].get('item', [])
        if not isinstance(articles, list):
            articles = [articles]
    elif 'feed' in data and 'entry' in data['feed']:
        articles = data['feed'].get('entry', [])
        if not isinstance(articles, list):
            articles = [articles]
    else:
        articles = []

    transformed = []
    for article in articles:
        # Extract article data based on common RSS fields with fallbacks
        title = get_nested_value(article, 'title')
        if isinstance(title, dict) and '#text' in title:
            title = title['#text']

        link = get_nested_value(article, 'link')
        if isinstance(link, dict) and '@href' in link:
            link = link['@href']
        elif isinstance(link, list):
            link = link[0].get('@href', '') if isinstance(link[0], dict) else link[0]

        description = get_nested_value(article, 'description') or get_nested_value(article, 'summary') or ''
        if isinstance(description, dict) and '#text' in description:
            description = description['#text']

        pub_date = get_nested_value(article, 'pubDate') or get_nested_value(article,
                                                                           'published') or get_nested_value(
            article, 'updated') or ''

        # Extract image
        image_url = extract_image_from_content(article) or random.choice(FALLBACK_IMAGES)

        # Get clean text summary
        clean_text = BeautifulSoup(description, 'html.parser').text.strip()
        summary = extract_summary(clean_text)

        transformed.append({
            'source': {'id': source_id, 'name': source_name},
            'author': get_nested_value(article, 'author') or get_nested_value(article, 'creator') or source_name,
            'title': title or "No Title Available",
            'description': summary,
            'url': link,
            'urlToImage': image_url,
            'publishedAt': pub_date,
            'content': clean_text
        })

    return transformed


def extract_image_from_content(article):
    """Extract image URL from article content or media fields"""
    # Try various common image locations in RSS

    # Check for media:content
    media_content = get_nested_value(article, 'media:content') or get_nested_value(article, 'media:thumbnail')
    if media_content:
        if isinstance(media_content, dict) and '@url' in media_content:
            return media_content['@url']
        elif isinstance(media_content, list):
            for media in media_content:
                if isinstance(media, dict) and '@url' in media:
                    return media['@url']

    # Check for enclosure
    enclosure = get_nested_value(article, 'enclosure')
    if enclosure and isinstance(enclosure, dict) and '@url' in enclosure:
        url = enclosure['@url']
        if url.endswith(('.jpg', '.jpeg', '.png', '.gif')):
            return url

    # Check description for img tags
    description = get_nested_value(article, 'description') or get_nested_value(article, 'summary') or ''
    if description:
        if isinstance(description, dict):
            description = description.get('#text', '')

        # Parse HTML and look for images
        soup = BeautifulSoup(description, 'html.parser')
        img_tag = soup.find('img')
        if img_tag and img_tag.get('src'):
            return img_tag['src']

    # Check content:encoded
    content = get_nested_value(article, 'content:encoded') or ''
    if content:
        soup = BeautifulSoup(content, 'html.parser')
        img_tag = soup.find('img')
        if img_tag and img_tag.get('src'):
            return img_tag['src']

    return None


def extract_summary(text, max_chars=220):
    """Create a clean summary from description text"""
    if not text:
        return "No description available"

    sentences = text.split('. ')
    if len(sentences) > 0:
        return sentences[0][:max_chars] + ("..." if len(sentences[0]) > max_chars else "")
    return text[:max_chars] + ("..." if len(text) > max_chars else "")


def get_nested_value(obj, key):
    """Safely get a potentially nested value from a dict"""
    if not obj or not isinstance(obj, dict):
        return None

    if key in obj:
        return obj[key]

    # Handle namespace cases (like media:content)
    for k in obj:
        if k.endswith(':' + key) or k == key:
            return obj[k]

    return None


def get_from_cache(key):
    """Get data from cache if it exists and hasn't expired"""
    with cache_lock:
        if key in news_cache:
            data, timestamp = news_cache[key]
            if time.time() - timestamp < CACHE_EXPIRATION:
                return data
            else:
                # Expired
                del news_cache[key]
    return None


def save_to_cache(key, data):
    """Save data to cache with current timestamp"""
    with cache_lock:
        news_cache[key] = (data, time.time())

    # Also save to disk for persistence
    cache_file = os.path.join(CACHE_DIR, f"{key}.json")
    try:
        with open(cache_file, 'w') as f:
            json.dump({
                'timestamp': time.time(),
                'data': data
            }, f)
    except Exception as e:
        print(f"Error saving cache to disk: {str(e)}")


@app.route('/', defaults={'path': ''})

@app.route('/<path:path>')
def serve_static(path):
    if not path or path == 'index.html':
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
