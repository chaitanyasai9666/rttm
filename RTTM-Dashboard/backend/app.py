import os
import sys
import subprocess
import atexit
from functools import wraps

backend_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')

if os.path.abspath(sys.executable).lower() != os.path.abspath(venv_python).lower():
    if os.path.exists(venv_python):
        print("[Auto-Switch] Detected global Python. Auto-switching to the project's virtual environment...")
        # Start a new process but wait for it to exit, and catch KeyboardInterrupt
        try:
            sys.exit(subprocess.call([venv_python] + sys.argv))
        except KeyboardInterrupt:
            sys.exit(0)
    else:
        print("[Warning] Virtual environment not found at 'venv'. Running anyway...")

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import jwt
    import datetime
    import requests
    import threading
    import smtplib
    from email.message import EmailMessage
    from werkzeug.security import check_password_hash
    from database import get_db_connection
    # We will define init_db locally in this file as requested
    
except ImportError:
    print("[Error] Dependencies missing.")
    print("Please run `pip install -r requirements.txt` inside your venv or install pyjwt, requests, werkzeug.")
    sys.exit(1)

frontend_process = None

def cleanup_frontend():
    if frontend_process:
        print("\n[Shutdown] Shutting down React Frontend...")
        subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
    frontend_dir = os.path.abspath(os.path.join(backend_dir, '..', 'frontend'))
    if os.path.exists(frontend_dir):
        print("[Launcher] Starting React Frontend in the background...")
        frontend_process = subprocess.Popen('npm run dev', cwd=frontend_dir, shell=True)
        atexit.register(cleanup_frontend)

app = Flask(__name__)
CORS(app)

SECRET_KEY = "my_super_secret_dev_key"

import sqlite3

def init_db():
    """
    Initializes the database and ensures the required tables exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. keywords table: requested by the user
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT UNIQUE NOT NULL
        )
    ''')
    
    # 2. alerts table: requested by the user (with keyword_matched)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            keyword_matched TEXT NOT NULL,
            source TEXT NOT NULL,
            url TEXT NOT NULL
        )
    ''')
    
    # Handle schema migration: if the alerts table was created previously with 'keyword', rename it
    try:
        cursor.execute("SELECT keyword FROM alerts LIMIT 1")
        # If the above doesn't throw an error, it means the old 'keyword' column still exists.
        cursor.execute("ALTER TABLE alerts RENAME COLUMN keyword TO keyword_matched")
        print("Migrated alerts table column 'keyword' to 'keyword_matched'")
    except sqlite3.OperationalError:
        # The column doesn't exist (either it's already keyword_matched, or table is empty)
        pass
        
    # Extra tables required by other routes in this app to prevent crashes
    cursor.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)')
    cursor.execute('CREATE TABLE IF NOT EXISTS target_urls (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT UNIQUE NOT NULL)')
    
    # Create the new settings table with a strict single row for receiver email
    cursor.execute('DROP TABLE IF EXISTS settings')
    cursor.execute('''
        CREATE TABLE settings (
            id INTEGER PRIMARY KEY,
            receiver_email TEXT
        )
    ''')
    
    # Insert a default empty row (id=1) so there is always exactly one row to update
    cursor.execute('INSERT INTO settings (id, receiver_email) VALUES (1, "")')
    
    conn.commit()
    conn.close()

# Initialize DB on start
with app.app_context():
    init_db()

# --- Auth Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(*args, **kwargs)
    return decorated

# --- Routes ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "RTTM Backend is active"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Could not verify'}), 401

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (data.get('username'),)).fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], data.get('password')):
        token = jwt.encode({
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({'token': token})

    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/keywords', methods=['GET', 'POST', 'DELETE'])
@token_required
def manage_keywords():
    conn = get_db_connection()
    if request.method == 'GET':
        keywords = conn.execute('SELECT id, keyword, priority FROM keywords').fetchall()
        conn.close()
        return jsonify([{'id': k['id'], 'keyword': k['keyword'], 'priority': k['priority']} for k in keywords])

    if request.method == 'POST':
        data = request.json
        if not data or not data.get('keyword'):
            return jsonify({'error': 'Keyword required'}), 400
        try:
            cursor = conn.cursor()
            priority = data.get('priority', 'Medium')
            cursor.execute('INSERT INTO keywords (keyword, priority) VALUES (?, ?)', (data['keyword'], priority))
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()
            return jsonify({'message': 'Keyword added', 'id': new_id}), 201
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 400

    if request.method == 'DELETE':
        data = request.json
        cursor = conn.cursor()
        cursor.execute('DELETE FROM keywords WHERE id = ?', (data.get('id'),))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Keyword removed'})

@app.route('/api/target_urls', methods=['GET', 'POST', 'DELETE'])
@token_required
def manage_urls():
    conn = get_db_connection()
    if request.method == 'GET':
        urls = conn.execute('SELECT id, url FROM target_urls').fetchall()
        conn.close()
        return jsonify([{'id': u['id'], 'url': u['url']} for u in urls])

    if request.method == 'POST':
        data = request.json
        if not data or not data.get('url'):
            return jsonify({'error': 'URL required'}), 400
        try:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO target_urls (url) VALUES (?)', (data['url'],))
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()
            return jsonify({'message': 'URL added', 'id': new_id}), 201
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 400

    if request.method == 'DELETE':
        data = request.json
        cursor = conn.cursor()
        # Allow deleting by exact string if id is missing
        if data.get('id'):
            cursor.execute('DELETE FROM target_urls WHERE id = ?', (data.get('id'),))
        elif data.get('url'):
            cursor.execute('DELETE FROM target_urls WHERE url = ?', (data.get('url'),))
        conn.commit()
        conn.close()
        return jsonify({'message': 'URL removed'})

@app.route('/api/target_urls/sync', methods=['POST'])
@token_required
def sync_urls():
    data = request.json
    if not isinstance(data, list):
        return jsonify({'error': 'Expected list of URLs'}), 400
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM target_urls')
        for url in data:
            if url.strip():
                cursor.execute('INSERT INTO target_urls (url) VALUES (?)', (url.strip(),))
        conn.commit()
        conn.close()
        return jsonify({'message': 'URLs synced successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/alerts', methods=['GET'])
@token_required
def get_alerts():
    """
    API Endpoint to fetch alerts.
    The React frontend calls this endpoint to retrieve and display the threat matches.
    It returns the 100 most recent alerts from the database.
    """
    conn = get_db_connection()
    # We alias keyword_matched to keyword so the React frontend still works without changes
    alerts = conn.execute('SELECT id, timestamp, keyword_matched AS keyword, source, url FROM alerts ORDER BY timestamp DESC LIMIT 100').fetchall()
    conn.close()
    # Convert SQLite Row objects to standard Python dictionaries and return as JSON
    return jsonify([dict(a) for a in alerts])

@app.route('/api/trigger-scan', methods=['POST'])
@token_required
def trigger_live_scan():
    """
    Live Intelligence Scan Endpoint.
    This route fetches live malicious URLs from URLhaus (via their open CSV feed) 
    and cross-references them against our saved keywords in real-time.
    """
    import csv
    from io import StringIO
    
    try:
        # 1. Fetch live data from URLhaus (using the open CSV feed to avoid API limits)
        # Using a 10-second timeout to prevent the server from hanging
        response = requests.get("https://urlhaus.abuse.ch/downloads/csv_recent/", timeout=15)
        
        # Ensure we received a valid response
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch from URLhaus'}), 502
            
        # 2. Connect to the database and fetch all saved keywords
        conn = get_db_connection()
        keywords_data = conn.execute('SELECT keyword FROM keywords').fetchall()
        
        # Convert keywords to lowercase for case-insensitive matching
        keyword_list = [row['keyword'].lower() for row in keywords_data]
        
        matches_found = 0
        cursor = conn.cursor()
        
        # 3. The Searching Algorithm
        # Parse the CSV data
        csv_file = StringIO(response.text)
        reader = csv.reader(csv_file)
        
        for row in reader:
            # Skip comments or empty rows
            if not row or row[0].startswith('#'):
                continue
                
            # URL is typically in the 3rd column (index 2) of the URLhaus CSV
            if len(row) > 2:
                original_url = row[2]
                malicious_url = original_url.lower()
                
                # Simple, readable case-insensitive string match
                for keyword in keyword_list:
                    if keyword in malicious_url:
                        # 4. Alert Generation
                        # If a match is found, insert a new row into the alerts table
                        cursor.execute('''
                            INSERT INTO alerts (keyword_matched, source, url)
                            VALUES (?, ?, ?)
                        ''', (keyword, 'URLhaus Live Feed', original_url))
                        
                        # Increment our counter to return to the frontend
                        matches_found += 1
                        
        # Commit the transaction and close the connection
        conn.commit()
        conn.close()
        
        # Return a success JSON response with the total number of threats found
        return jsonify({'message': 'Scan complete', 'matches': matches_found}), 200
        
    # 5. Error Handling
    # Catch any network or server errors to prevent crashing
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Network error: {str(e)}'}), 502
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/target-scan', methods=['POST'])
@token_required
def trigger_target_scan():
    """
    Target URL Scanner Endpoint.
    Connects to the database, fetches target URLs and keywords,
    and loops through each URL to scan the webpage text for matches.
    """
    try:
        # 1. Connect to the database
        conn = get_db_connection()
        
        # 2. Fetch saved keywords
        keywords_data = conn.execute('SELECT keyword FROM keywords').fetchall()
        keyword_list = [row['keyword'].lower() for row in keywords_data]
        
        # 3. Fetch saved target URLs
        urls_data = conn.execute('SELECT url FROM target_urls').fetchall()
        target_urls = [row['url'] for row in urls_data]
        
        urls_scanned = len(target_urls)
        matches_found = 0
        cursor = conn.cursor()
        
        # 4. Loop through each URL
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RTTM-Target-Scanner'}
        for url in target_urls:
            try:
                # Use requests to fetch webpage text with a 5-second timeout
                response = requests.get(url, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    text_content = response.text.lower()
                    
                    # Check if any keyword exists in the text (case-insensitive)
                    for keyword in keyword_list:
                        if keyword in text_content:
                            # 5. Alert Generation
                            cursor.execute('''
                                INSERT INTO alerts (keyword_matched, source, url)
                                VALUES (?, ?, ?)
                            ''', (keyword, 'Targeted OSINT Scan', url))
                            matches_found += 1
            except requests.exceptions.RequestException:
                # Catch 5-second timeouts or dead links so they don't crash the loop
                continue
                
        conn.commit()
        conn.close()
        
        # 6. Return JSON response
        return jsonify({
            'status': 'success',
            'urls_scanned': urls_scanned,
            'matches_found': matches_found
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/settings', methods=['POST'])
@token_required
def save_receiver_email():
    """
    Saves the dynamic receiver email address configured from the React frontend.
    Updates the strictly defined id=1 row.
    """
    data = request.json
    email = data.get('email', '')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE settings SET receiver_email = ? WHERE id = 1', (email,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Alert Destination Saved!'}), 200

@app.route('/api/test-email', methods=['POST'])
@token_required
def test_email():
    """
    Fetches the email from the database and triggers a test email.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute('SELECT receiver_email FROM settings LIMIT 1').fetchone()
    conn.close()
    
    if not row or not row['receiver_email']:
        return jsonify({'error': 'No receiver email configured'}), 400
        
    receiver_email = row['receiver_email']
    
    try:
        send_alert_email("TEST_KEYWORD", "https://rttm.system/test", receiver_email)
        return jsonify({'status': 'success', 'message': 'Test email sent!'})
    except Exception as e:
        return jsonify({'error': f'SMTP Error: {str(e)}'}), 500

def send_alert_email(keyword, url, receiver_email):
    """
    Sends an automated email alert when a threat match is found.
    """
    # Hardcoded credentials as requested
    SENDER_EMAIL = "rttmproject@gmail.com"
    APP_PASSWORD = "sjqgszchoszzykqq"
    
    try:
        msg = EmailMessage()
        msg['Subject'] = f"RTTM Alert: Threat '{keyword}' Detected"
        msg['From'] = SENDER_EMAIL
        msg['To'] = receiver_email
        msg.set_content(f"Automated RTTM Alert.\n\nA threat matching the keyword '{keyword}' was detected at the following URL:\n{url}")
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)
            
        print(f"-> [EMAIL SENT] Alert sent to {receiver_email}: Threat '{keyword}' detected at {url}")
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise e

# ==========================================
# Automated Background Threat Intelligence
# ==========================================

background_thread = None
stop_event = threading.Event()

def background_scan_task(interval_minutes, stop_event):
    """
    Background daemon that silently runs the target OSINT scan loop.
    Uses the exact target_urls logic from /api/target-scan.
    """
    interval_seconds = interval_minutes * 60
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RTTM-Auto-Scanner'}
    
    print(f"[DAEMON] Started background OSINT loop (Interval: {interval_minutes}m)")
    
    while not stop_event.is_set():
        try:
            conn = get_db_connection()
            keywords_data = conn.execute('SELECT keyword FROM keywords').fetchall()
            keyword_list = [row['keyword'].lower() for row in keywords_data]
            
            urls_data = conn.execute('SELECT url FROM target_urls').fetchall()
            target_urls = [row['url'] for row in urls_data]
            
            cursor = conn.cursor()
            
            for url in target_urls:
                if stop_event.is_set():
                    break
                try:
                    response = requests.get(url, headers=headers, timeout=5)
                    if response.status_code == 200:
                        text_content = response.text.lower()
                        for keyword in keyword_list:
                            if keyword in text_content:
                                print(f"[DAEMON] [ALERT] Found '{keyword}' at {url}")
                                cursor.execute('''
                                    INSERT INTO alerts (keyword_matched, source, url)
                                    VALUES (?, ?, ?)
                                ''', (keyword, 'Automated OSINT Daemon', url))
                                # We also trigger an email alert here!
                                conn_email = get_db_connection()
                                row = conn_email.execute('SELECT receiver_email FROM settings LIMIT 1').fetchone()
                                conn_email.close()
                                if row and row['receiver_email']:
                                    send_alert_email(keyword, url, row['receiver_email'])
                except requests.exceptions.RequestException:
                    continue
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"[DAEMON] Error during cycle: {e}")
            
        # Wait for the specified interval, or break immediately if stop_event is set
        stop_event.wait(interval_seconds)
        
    print("[DAEMON] Background OSINT loop terminated.")

@app.route('/api/auto-scan/start', methods=['POST'])
@token_required
def start_auto_scan():
    global background_thread, stop_event
    data = request.json
    interval_minutes = int(data.get('interval', 1))
    
    if background_thread and background_thread.is_alive():
        # Stop existing thread before starting a new one
        stop_event.set()
        background_thread.join(timeout=2)
        
    stop_event.clear()
    background_thread = threading.Thread(target=background_scan_task, args=(interval_minutes, stop_event), daemon=True)
    background_thread.start()
    
    return jsonify({'status': 'started', 'interval': interval_minutes})

@app.route('/api/auto-scan/stop', methods=['POST'])
@token_required
def stop_auto_scan():
    global background_thread, stop_event
    if background_thread and background_thread.is_alive():
        stop_event.set()
        return jsonify({'status': 'stopped'})
    return jsonify({'status': 'already_stopped'})

if __name__ == '__main__':
    print("[Launcher] Starting Flask Backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)
