import sqlite3

def update():
    conn = sqlite3.connect('rttm.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE keywords ADD COLUMN priority TEXT DEFAULT 'Medium'")
        print("Added 'priority' to keywords.")
    except Exception as e:
        print(f"Keywords alter error: {e}")
        
    try:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )
        ''')
        # Seed default settings
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('scrape_interval', '60')")
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('alert_email', '')")
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark')")
        print("Created settings table.")
    except Exception as e:
        print(f"Settings table error: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    update()
