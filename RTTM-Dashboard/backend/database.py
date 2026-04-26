import sqlite3
import os
from werkzeug.security import generate_password_hash

# Path to the SQLite database file
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rttm.db')

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    We use sqlite3.Row as the row_factory so that we can access columns by name 
    (like a dictionary) instead of by index.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes the database schema.
    This function creates all necessary tables if they do not already exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table to store administrator credentials
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
    ''')
    
    # Table to store the target URLs that the web scraper will visit
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS target_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL
    )
    ''')
    
    # Table to store the keywords/terms we are actively searching for
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE NOT NULL
    )
    ''')

    # Table to store the alerts generated when a keyword match is found
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        keyword TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT NOT NULL
    )
    ''')

    # Seed a default admin user if the database is empty
    cursor.execute('SELECT id FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        hashed = generate_password_hash('password')
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", ('admin', hashed))
        print("Seeded default admin user")

    # Commit all table creations and data insertions
    conn.commit()
    conn.close()
    print("SQLite database initialized.")

if __name__ == '__main__':
    init_db()
