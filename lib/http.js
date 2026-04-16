function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function ok(res, body) {
  return json(res, 200, body);
}

export function badRequest(res, message, detail) {
  return json(res, 400, { error: message, detail });
}

export function unauthorized(res) {
  return json(res, 401, { error: 'Unauthorized' });
}

export function methodNotAllowed(res, method = 'POST') {
  res.setHeader('allow', method);
  return json(res, 405, { error: 'Method Not Allowed' });
}

export function serverError(res, error) {
  return json(res, 500, {
    error: 'Internal Server Error',
    detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error)
  });
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

export function checkApiKey(req) {
  const expected = process.env.API_KEY;
  if (!expected) return true;
  const received = req.headers['x-api-key'];
  return received === expected;
}
