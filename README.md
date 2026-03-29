# Business Decision Assistant

A startup-style MVP for small businesses that combines operational metrics, forecasting, anomaly detection, and AI-style recommendations.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Data layer today: mock in-memory dataset shaped for future PostgreSQL ingestion
- AI layer today: deterministic recommendation engine with a chat-style explanation API

## What is implemented

- Executive dashboard for sales, expenses, profit, and inventory
- Seven-day sales forecast
- Stock planning recommendations
- Expense anomaly detection
- Chat interface for business questions such as "Why is my profit low this week?"
- API structure ready for real business data and LLM integration

## Run

1. Install dependencies:
   - `npm.cmd install`
2. Start the backend:
   - `npm.cmd run dev:backend`
3. Start the frontend in another terminal:
   - `npm.cmd run dev:frontend`
4. Open the frontend URL shown by Vite.

## Information I will need from you next

- Business type and outlet count
- Product catalog or inventory items
- Typical daily sales fields you track
- Typical expense categories
- Current stock units and reorder rules
- Any existing Excel, CSV, POS, or accounting exports

## Suggested next phases

1. Replace mock data with your real Shawok data import
2. Add PostgreSQL persistence and authentication
3. Add a Python forecasting service for Prophet or LSTM
4. Add an LLM provider for richer conversational analysis
