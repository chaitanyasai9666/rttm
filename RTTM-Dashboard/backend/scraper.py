import time
import threading
import requests
from urllib.parse import urlparse
from database import get_db_connection

def scrape_and_match():
    print("[Scraper] Starting scrape cycle...")
    conn = get_db_connection()
    try:
        urls = conn.execute('SELECT url FROM target_urls').fetchall()
        keywords = conn.execute('SELECT keyword FROM keywords').fetchall()

        if not urls or not keywords:
            print("[Scraper] Missing URLs or Keywords. Skipping cycle.")
            return

        keyword_list = [k['keyword'].lower() for k in keywords]

        for url_row in urls:
            url = url_row['url']
            try:
                # Basic headers to prevent immediate blocking
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RTTM-Bot'}
                print(f"[Scraper] Fetching {url}")
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    text_content = response.text.lower()
                    
                    found_matches = []
                    for kw in keyword_list:
                        if kw in text_content:
                            found_matches.append(kw)
                            
                    if found_matches:
                        # Extract source from URL
                        parsed_uri = urlparse(url)
                        source = f"{parsed_uri.netloc}"
                        
                        cursor = conn.cursor()
                        for match in found_matches:
                            # Avoid duplicate alerts for the same site in a short timeframe (simplified insert for now)
                            cursor.execute('''
                                INSERT INTO alerts (keyword, source, url)
                                VALUES (?, ?, ?)
                            ''', (match, source, url))
                            print(f"[Scraper] [ALERT] Keyword '{match}' found at {url}")
                        conn.commit()
                else:
                    print(f"[Scraper] Warning: API returned {response.status_code} for {url}")
            except Exception as e:
                print(f"[Scraper] Error fetching {url}: {e}")
                
    except Exception as e:
        print(f"[Scraper] Database error: {e}")
    finally:
        conn.close()
    print("[Scraper] Cycle complete. Waiting for next interval...")

def start_scraping_loop(interval=60):
    """Runs the scraping loop efficiently in a background thread."""
    def loop():
        while True:
            scrape_and_match()
            time.sleep(interval)
            
    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
    return thread
