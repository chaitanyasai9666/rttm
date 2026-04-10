import sqlite3
import requests
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rttm.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def ingest_data():
    print("🚀 Starting ingestion cycle...")
    conn = get_db_connection()
    try:
        urls = conn.execute('SELECT * FROM target_urls').fetchall()
    except sqlite3.OperationalError:
        print("❌ Error: Database tables not found. Ensure app.py / database.py has run first.")
        return
    finally:
        conn.close()

    if not urls:
        print("⚠️ No target URLs found in the database. Add some via the Settings page.")
        return

    for url_row in urls:
        url = url_row['url']
        try:
            print(f"📡 Fetching data from: {url}")
            # Add a basic header so websites don't immediately block the python script
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RTTM Ingestion Engine'}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # For Sprint 2, just print a snippet of the raw HTML/text fetched
            content_snippet = response.text[:250].replace('\n', ' ')
            print(f"✅ Success! Received {len(response.text)} characters. Snippet: {content_snippet}...")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch {url}. Error: {e}")

if __name__ == "__main__":
    ingest_data()
