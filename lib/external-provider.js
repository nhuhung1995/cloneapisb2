async function callProvider(path, payload) {
  const baseUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.EXTERNAL_API_KEY ? { 'x-api-key': process.env.EXTERNAL_API_KEY } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`External API failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchChomeByZipcode(payload) {
  return callProvider('/flow/zipcode', payload);
}

export async function fetchBanchiByChome(payload) {
  return callProvider('/flow/chome', payload);
}

export async function fetchRoomByBanchi(payload) {
  return callProvider('/flow/banchi', payload);
}

export async function fetchEligibility(payload) {
  return callProvider('/check-availability', payload);
}
