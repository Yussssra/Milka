export async function fetchDashboard() {
  const response = await fetch('http://localhost:4000/api/dashboard');
  if (!response.ok) {
    throw new Error('Failed to load dashboard data');
  }
  return response.json();
}

export async function askAssistant(question) {
  const response = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question })
  });

  if (!response.ok) {
    throw new Error('Failed to get assistant response');
  }

  return response.json();
}
