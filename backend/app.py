from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import json
import sqlite3
import os
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

app = Flask(__name__)

# ✅ Allow React frontend (Vite/React runs on port 5173)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# 🔧 Firebase Config
SERVICE_ACCOUNT_FILE = 'koico-19691-04907131f6d1.json'
SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']
FCM_URL = 'https://fcm.googleapis.com/v1/projects/koico-19691/messages:send'

# 🗓️ Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# 🧠 Initialize SQLite DB
def init_db():
    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS scheduled_messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  content TEXT,
                  send_time TEXT,
                  start_date TEXT,
                  end_date TEXT,
                  loop_daily BOOLEAN,
                  status TEXT)''')

    c.execute('''CREATE TABLE IF NOT EXISTS message_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  content TEXT,
                  sent_time TIMESTAMP,
                  status TEXT)''')
    conn.commit()
    conn.close()

# 🔐 Get Access Token from Firebase service account
def get_access_token():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials.token

# 📤 Send FCM Notification to topic 'all'
def send_fcm_message(content):
    try:
        access_token = get_access_token()
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json; charset=UTF-8',
        }

        message = {
            "message": {
                "topic": "all",
                "data": {
                    "url": content
                },
                "android": {
                    "priority": "HIGH",
                    "ttl": "3600s"
                }
            }
        }

        response = requests.post(FCM_URL, headers=headers, data=json.dumps(message))
        print("FCM Response:", response.status_code, response.text)

        if response.status_code == 200:
            return True, response.text
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

# 🚀 Send Now
@app.route('/api/send-now', methods=['POST'])
def send_now():
    data = request.json
    content = data.get('content')

    success, response = send_fcm_message(content)

    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()
    c.execute('''INSERT INTO message_history 
                 (content, sent_time, status)
                 VALUES (?, ?, ?)''',
              (content, datetime.now(), 'success' if success else 'error'))
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success' if success else 'error',
        'response': response
    })

# 🗓️ Schedule Message
@app.route('/api/schedule', methods=['POST'])
def schedule_message():
    data = request.json
    content = data['content']
    send_time = data['send_time']
    start_date = data['start_date']
    end_date = data.get('end_date')
    loop_daily = data['loop_daily']

    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()

    c.execute('''INSERT INTO scheduled_messages 
                 (content, send_time, start_date, end_date, loop_daily, status)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (content, send_time, start_date, end_date, loop_daily, 'active'))

    msg_id = c.lastrowid
    conn.commit()
    conn.close()

    if loop_daily:
        hour, minute = map(int, send_time.split(':'))
        scheduler.add_job(
            send_fcm_message,
            'cron',
            args=[content],
            hour=hour,
            minute=minute,
            id=f'msg_{msg_id}'
        )

    return jsonify({'status': 'success', 'id': msg_id})

# ❌ Cancel Scheduled Message
@app.route('/api/cancel/<int:msg_id>', methods=['DELETE'])
def cancel_message(msg_id):
    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()
    c.execute('UPDATE scheduled_messages SET status = ? WHERE id = ?', ('cancelled', msg_id))
    conn.commit()
    conn.close()

    try:
        scheduler.remove_job(f'msg_{msg_id}')
    except:
        pass

    return jsonify({'status': 'success'})

# 📋 List Scheduled Messages
@app.route('/api/messages', methods=['GET'])
def get_messages():
    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()
    c.execute('SELECT * FROM scheduled_messages WHERE status != ?', ('cancelled',))
    messages = [dict(zip(['id', 'content', 'send_time', 'start_date', 'end_date',
                          'loop_daily', 'status'], row))
                for row in c.fetchall()]
    conn.close()
    return jsonify(messages)

# 🧾 Message History
@app.route('/api/history', methods=['GET'])
def get_history():
    conn = sqlite3.connect('notifications.db')
    c = conn.cursor()
    c.execute('SELECT * FROM message_history ORDER BY sent_time DESC LIMIT 100')
    history = [dict(zip(['id', 'content', 'sent_time', 'status'], row))
               for row in c.fetchall()]
    conn.close()
    return jsonify(history)

# 🏁 Start Server
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
