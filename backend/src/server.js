import express from 'express';
import cors from 'cors';
import { answerQuestion, buildDashboardPayload } from './analytics.js';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(buildDashboardPayload());
});

app.post('/api/chat', (req, res) => {
  const question = req.body?.question || '';
  res.json({ answer: answerQuestion(question) });
});

app.listen(port, () => {
  console.log(`OpsPilot API listening on http://localhost:${port}`);
});
