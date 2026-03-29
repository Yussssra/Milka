import { useState } from 'react';
import { askAssistant } from '../lib/api';

const starterQuestions = [
  'Why is my profit low this week?',
  'Which stock item needs attention first?',
  'What cost looks abnormal right now?'
];

export function ChatPanel() {
  const [question, setQuestion] = useState(starterQuestions[0]);
  const [answer, setAnswer] = useState('Ask the assistant for a plain-language explanation of business performance.');
  const [loading, setLoading] = useState(false);

  async function handleAsk(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await askAssistant(question);
      setAnswer(result.answer);
    } catch (error) {
      setAnswer(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Assistant</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Ask why the business moved</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {starterQuestions.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-ember hover:text-ember"
              onClick={() => setQuestion(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleAsk}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-28 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base text-ink outline-none ring-0 transition focus:border-ember"
          placeholder="Type your business question"
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">The current assistant uses business rules. We can swap in an LLM after your data model is ready.</p>
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" disabled={loading}>
            {loading ? 'Thinking...' : 'Ask Assistant'}
          </button>
        </div>
      </form>
      <div className="mt-6 rounded-3xl bg-ink p-5 text-sand">
        <p className="text-xs uppercase tracking-[0.24em] text-sand/60">Response</p>
        <p className="mt-3 text-sm leading-7">{answer}</p>
      </div>
    </div>
  );
}
