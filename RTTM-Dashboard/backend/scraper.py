import time
import threading
import requests
from urllib.parse import urlparse
from database import get_db_connection

def gather_from_target_urls(cursor, target_urls, keyword_list):
    """
    1. TARGETED MONITORING
    Visits specific URLs configured by the user (like public text files or forums)
    and checks if the HTML/text content contains any of the keywords.
    """
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RTTM-Bot'}
    for url in target_urls:
        try:
            print(f"[OSINT] Targeted Scan: Fetching {url}")
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                text_content = response.text.lower()
                source_domain = urlparse(url).netloc
                
                for keyword in keyword_list:
                    if keyword in text_content:
                        print(f"[OSINT] [ALERT] Keyword '{keyword}' found in {url}")
                        cursor.execute('''
                            INSERT INTO alerts (keyword_matched, source, url)
                            VALUES (?, ?, ?)
                        ''', (keyword, source_domain, url))
        except Exception as e:
            print(f"[OSINT] Targeted Scan Error for {url}: {e}")


def gather_from_github_api(cursor, keyword_list):
    """
    2. GITHUB CODE SEARCH API
    Queries the official GitHub Search API to see if the keywords exist in 
    public code repositories anywhere in the world.
    """
    headers = {'Accept': 'application/vnd.github.v3+json'}
    for keyword in keyword_list:
        try:
            # Query the GitHub Search API for the specific keyword
            api_url = f"https://api.github.com/search/code?q={keyword}"
            print(f"[OSINT] GitHub API Scan: Searching for '{keyword}'")
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # If total_count > 0, the keyword has been leaked in public code
                if data.get('total_count', 0) > 0:
                    # Get the URL of the first repository where it was found
                    first_match = data['items'][0]['html_url'] if data['items'] else api_url
                    print(f"[OSINT] [ALERT] Keyword '{keyword}' leaked on GitHub!")
                    cursor.execute('''
                        INSERT INTO alerts (keyword_matched, source, url)
                        VALUES (?, ?, ?)
                    ''', (keyword, 'GitHub Public Code', first_match))
                    
            # GitHub heavily limits unauthenticated searches (10 requests per minute)
            # We pause for 3 seconds to avoid HTTP 403 Rate Limit errors during the demo.
            time.sleep(3)
            
        except Exception as e:
            print(f"[OSINT] GitHub API Error for '{keyword}': {e}")


def gather_from_reddit_rss(cursor, keyword_list):
    """
    3. REDDIT RSS FEED MONITORING
    Instead of scraping reddit.com (which blocks automated bots), we fetch the
    live RSS feed of new posts and search the raw XML for our keywords.
    """
    # Reddit requires a unique User-Agent to avoid getting blocked
    headers = {'User-Agent': 'python:rttm.osint.bot:v1.0 (by /u/RTTM_Academic_Project)'}
    try:
        # Fetch the newest posts across all of Reddit
        rss_url = "https://www.reddit.com/r/all/new/.rss"
        print("[OSINT] Reddit RSS Scan: Fetching live feed")
        response = requests.get(rss_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            xml_content = response.text.lower()
            for keyword in keyword_list:
                # If the keyword is mentioned in the XML, someone just posted about it
                if keyword in xml_content:
                    print(f"[OSINT] [ALERT] Keyword '{keyword}' found in recent Reddit post!")
                    cursor.execute('''
                        INSERT INTO alerts (keyword_matched, source, url)
                        VALUES (?, ?, ?)
                    ''', (keyword, 'Reddit Live Feed', rss_url))
    except Exception as e:
        print(f"[OSINT] Reddit RSS Error: {e}")


def scrape_and_match():
    """
    The main coordinator function. It fetches the latest URLs and Keywords from 
    the database, and dispatches them to our three distinct OSINT intelligence gatherers.
    """
    print("\n[OSINT] === Starting Intelligence Gathering Cycle ===")
    conn = get_db_connection()
    try:
        urls_data = conn.execute('SELECT url FROM target_urls').fetchall()
        keywords_data = conn.execute('SELECT keyword FROM keywords').fetchall()

        if not keywords_data:
            print("[OSINT] No Keywords configured. Skipping cycle.")
            return

        target_urls = [row['url'] for row in urls_data]
        keyword_list = [row['keyword'].lower() for row in keywords_data]
        
        cursor = conn.cursor()

        # Execute our 3 gathering strategies
        gather_from_target_urls(cursor, target_urls, keyword_list)
        gather_from_github_api(cursor, keyword_list)
        gather_from_reddit_rss(cursor, keyword_list)
        
        conn.commit()
                
    except Exception as e:
        print(f"[OSINT] Database error during gather cycle: {e}")
    finally:
        conn.close()
        
    print("[OSINT] === Cycle complete. Waiting for next interval ===\n")


def start_scraping_loop(interval=60):
    """
    Runs the gathering process continuously in a background thread.
    The interval specifies how many seconds to wait between cycles.
    """
    def loop():
        while True:
            scrape_and_match()
            time.sleep(interval)
            
    # Use a daemon thread so it automatically shuts down when the main Flask app exits
    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
    return thread
