import { handleApiRequest } from '../server/index.mjs';

export default function sheets(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = url.searchParams.get('path');
  if (!path) {
    response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Not found.' }));
    return;
  }

  request.url = `/api/sheets/${path}`;
  return handleApiRequest(request, response);
}
