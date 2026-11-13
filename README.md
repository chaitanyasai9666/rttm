# RTTM — Real-Time Threat Monitoring

A threat-intelligence monitoring dashboard. You save keywords (a company name, a domain, a product)
and RTTM searches public sources for them, records every match as an alert and can email you.

## What it watches

- **URLhaus** – the live feed of recently reported malicious URLs
- **GitHub code search** – public repositories that mention a keyword
- **Reddit** – new posts, read through the RSS feed
- **Your own target pages** – any URLs you add, such as paste sites or forums

## How it is built

| Part | Technology | Where |
|---|---|---|
| API and scanners | Python, Flask, SQLite | `RTTM-Dashboard/backend` |
| Dashboard | React, Vite | `RTTM-Dashboard/frontend` |
| Login | JWT tokens, hashed passwords | `backend/app.py` |
| Alerts by email | Gmail SMTP | `backend/app.py` |
| Background scanning | a timer thread you start and stop from the dashboard | `backend/app.py` |

## Run it

Backend:

```bash
cd RTTM-Dashboard/backend
pip install -r requirements.txt pyjwt requests
```

Set the secrets listed in `.env.example` as environment variables, then:

```bash
python app.py
```

Frontend:

```bash
cd RTTM-Dashboard/frontend
npm install
npm run dev
```

## Secrets

No secret lives in the code. The token signing key, the first admin password and the email
credentials are read from environment variables (`backend/.env.example` lists them), and the
database file is git-ignored because it holds user accounts and collected alerts.
