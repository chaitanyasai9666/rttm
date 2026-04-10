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
    from werkzeug.security import check_password_hash
    from database import init_db, get_db_connection
    from scraper import start_scraping_loop

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

@app.route('/api/settings', methods=['GET', 'POST'])
@token_required
def manage_settings():
    conn = get_db_connection()
    if request.method == 'GET':
        rows = conn.execute('SELECT key, value FROM settings').fetchall()
        settings_dict = {row['key']: row['value'] for row in rows}
        conn.close()
        return jsonify(settings_dict)

    if request.method == 'POST':
        data = request.json
        cursor = conn.cursor()
        for key, value in data.items():
            cursor.execute('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', (key, str(value)))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Settings updated'})

if __name__ == '__main__':
    print("[Launcher] Starting Flask Backend...")
    # Only start the scraper loop in the main worker process (not the parent watcher)
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        start_scraping_loop(interval=60)
        
    app.run(host='0.0.0.0', port=5000, debug=True)
