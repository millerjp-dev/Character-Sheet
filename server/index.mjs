import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';

const port = Number(process.env.API_PORT ?? 3001);
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const sheetEditorPassword = process.env.SHEET_EDITOR_PASSWORD;
const requiredHeaders = {
  Characters: ['id', 'name', 'primaryColor', 'secondaryColor'],
  Stats: ['characterId', 'name', 'score', 'modifier'],
  Skills: ['characterId', 'name', 'bonus'],
};
const sheetTabs = Object.keys(requiredHeaders);
const backgroundThemes = new Set([
  'deep-space',
  'arcane-forest',
  'warm-parchment',
  'rune-twilight',
]);

function requireConfiguration() {
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not configured.');
  }

  if (!keyFile && !serviceAccountJson) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON.',
    );
  }
}

function readTable(valueRange, tabName) {
  const [headerRow = [], ...rows] = valueRange.values ?? [];
  const headers = headerRow.map((header) => String(header).trim());
  const missingHeaders = requiredHeaders[tabName].filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `${tabName} is missing required columns: ${missingHeaders.join(', ')}.`,
    );
  }

  return rows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] ?? '']),
      ),
    );
}

function requireText(value, field, tabName) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`${tabName} contains a row with an empty ${field}.`);
  }
  return text;
}

function requireNumber(value, field, tabName) {
  if (String(value ?? '').trim() === '') {
    throw new Error(`${tabName} contains a row with an empty ${field}.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${tabName} contains an invalid number for ${field}.`);
  }
  return number;
}

function requireHexColor(value, field) {
  const color = requireText(value, field, 'Characters');
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) {
    throw new Error(`Characters contains an invalid ${field}; use #RGB or #RRGGBB.`);
  }
  return color;
}

function optionalImageUrl(value) {
  const imageUrl = String(value ?? '').trim();
  if (!imageUrl) {
    return undefined;
  }

  let url;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error('Characters contains an invalid imageUrl; use an HTTP or HTTPS URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Characters contains an invalid imageUrl; use an HTTP or HTTPS URL.');
  }

  return imageUrl;
}

function backgroundTheme(value) {
  const theme = String(value ?? '').trim();
  if (!theme) {
    return 'warm-parchment';
  }
  if (!backgroundThemes.has(theme)) {
    throw new Error(
      `Characters contains an invalid backgroundTheme; use one of ${[...backgroundThemes].join(', ')}.`,
    );
  }
  return theme;
}

function validateCellValue(tabName, column, value) {
  const text = String(value ?? '');
  if (tabName === 'Characters') {
    if (['id', 'name', 'primaryColor', 'secondaryColor'].includes(column) && !text.trim()) {
      throw new Error(`${column} cannot be blank.`);
    }
    if (column === 'primaryColor' || column === 'secondaryColor') {
      requireHexColor(text, column);
    } else if (column === 'imageUrl') {
      optionalImageUrl(text);
    } else if (column === 'backgroundTheme') {
      backgroundTheme(text);
    }
  } else if (tabName === 'Stats') {
    if (['characterId', 'name', 'score'].includes(column) && !text.trim()) {
      throw new Error(`${column} cannot be blank.`);
    }
    if (column === 'score' || (column === 'modifier' && text.trim())) {
      requireNumber(text, column, tabName);
    }
  } else if (tabName === 'Skills') {
    if (['characterId', 'name', 'bonus'].includes(column) && !text.trim()) {
      throw new Error(`${column} cannot be blank.`);
    }
    if (column === 'bonus') {
      requireNumber(text, column, tabName);
    }
  }
  return text;
}

function readEditableSheet(valueRange, tabName) {
  const [headerRow = [], ...rows] = valueRange.values ?? [];
  const headers = headerRow.map((header) => String(header ?? '').trim());
  while (headers.length > 0 && !headers.at(-1)) {
    headers.pop();
  }
  if (headers.some((header) => !header)) {
    throw new Error(`${tabName} contains a blank column header.`);
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error(`${tabName} contains duplicate column headers.`);
  }

  const missingHeaders = requiredHeaders[tabName].filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `${tabName} is missing required columns: ${missingHeaders.join(', ')}.`,
    );
  }

  return {
    tab: tabName,
    headers,
    rows: rows.flatMap((row, index) => {
      if (!row.some((cell) => String(cell ?? '').trim() !== '')) {
        return [];
      }
      const values = Object.fromEntries(
        headers.map((header, columnIndex) => [header, String(row[columnIndex] ?? '')]),
      );
      return [{ rowNumber: index + 2, values }];
    }),
  };
}

function columnLetter(index) {
  let number = index + 1;
  let result = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

async function getGoogleAccessToken() {
  requireConfiguration();
  let credentials;
  if (serviceAccountJson) {
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.');
    }
  }
  const auth = new GoogleAuth({
    ...(credentials ? { credentials } : { keyFile }),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new Error('Google authentication did not return an access token.');
  }
  return accessToken.token;
}

async function sheetsRequest(path, options = {}) {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Google Sheets API returned HTTP ${response.status}.`);
  }
  return response.status === 204 ? null : response.json();
}

async function getEditableSheet(tabName) {
  const range = encodeURIComponent(`${tabName}!A:Z`);
  const valueRange = await sheetsRequest(`/values/${range}`);
  return readEditableSheet(valueRange, tabName);
}

function requireRecord(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function validateNewRow(tabName, headers, input) {
  const values = requireRecord(input, 'Row values');
  const unknownColumns = Object.keys(values).filter((column) => !headers.includes(column));
  if (unknownColumns.length > 0) {
    throw new Error(`Unknown column${unknownColumns.length > 1 ? 's' : ''}: ${unknownColumns.join(', ')}.`);
  }
  const row = Object.fromEntries(
    headers.map((header) => [header, validateCellValue(tabName, header, values[header] ?? '')]),
  );
  for (const header of requiredHeaders[tabName]) {
    if (header !== 'modifier' && !row[header].trim()) {
      throw new Error(`${header} cannot be blank.`);
    }
  }
  return row;
}

async function appendSheetRow(tabName, input) {
  const sheet = await getEditableSheet(tabName);
  const row = validateNewRow(tabName, sheet.headers, input);
  if (tabName === 'Characters' && sheet.rows.some(({ values }) => values.id === row.id)) {
    throw new Error(`A character with id "${row.id}" already exists.`);
  }
  if (tabName !== 'Characters') {
    const characters = await getEditableSheet('Characters');
    if (!characters.rows.some(({ values }) => values.id === row.characterId)) {
      throw new Error(`No character exists with id "${row.characterId}".`);
    }
  }

  const range = encodeURIComponent(`${tabName}!A:Z`);
  const parameters = new URLSearchParams({
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
  });
  await sheetsRequest(`/values/${range}:append?${parameters}`, {
    method: 'POST',
    body: JSON.stringify({
      majorDimension: 'ROWS',
      values: [sheet.headers.map((header) => row[header])],
    }),
  });
}

async function updateSheetCell(tabName, rowNumber, input) {
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Row number must be an integer of 2 or greater.');
  }
  const body = requireRecord(input, 'Update');
  const column = typeof body.column === 'string' ? body.column : '';
  if (column === 'id' || column === 'characterId') {
    throw new Error('ID columns are locked to protect character relationships.');
  }
  if (typeof body.value !== 'string') {
    throw new Error('Cell value must be text.');
  }
  const sheet = await getEditableSheet(tabName);
  const record = sheet.rows.find((row) => row.rowNumber === rowNumber);
  if (!record) {
    throw new Error('That row no longer exists. Refresh the sheet and try again.');
  }
  if (!body.expectedValues || typeof body.expectedValues !== 'object' ||
      JSON.stringify(body.expectedValues) !== JSON.stringify(record.values)) {
    throw new Error('That row has changed since it was loaded. Refresh the sheet and try again.');
  }
  const columnIndex = sheet.headers.indexOf(column);
  if (columnIndex < 0) {
    throw new Error('Choose an existing column header.');
  }
  const value = validateCellValue(tabName, column, body.value);
  const range = encodeURIComponent(`${tabName}!${columnLetter(columnIndex)}${rowNumber}`);
  await sheetsRequest(`/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ majorDimension: 'ROWS', values: [[value]] }),
  });
}

async function deleteSheetRow(tabName, rowNumber, input) {
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Row number must be an integer of 2 or greater.');
  }
  const body = requireRecord(input, 'Delete');
  const sheet = await getEditableSheet(tabName);
  const record = sheet.rows.find((row) => row.rowNumber === rowNumber);
  if (!record) {
    throw new Error('That row no longer exists. Refresh the sheet and try again.');
  }
  if (!body.expectedValues || JSON.stringify(body.expectedValues) !== JSON.stringify(record.values)) {
    throw new Error('That row has changed since it was loaded. Refresh the sheet and try again.');
  }
  if (tabName === 'Characters') {
    const characterId = record.values.id;
    for (const relatedTab of ['Stats', 'Skills']) {
      const relatedSheet = await getEditableSheet(relatedTab);
      if (relatedSheet.rows.some(({ values }) => values.characterId === characterId)) {
        throw new Error(`Cannot delete this character while it has ${relatedTab.toLowerCase()} rows.`);
      }
    }
  }

  const spreadsheet = await sheetsRequest('');
  const sheetId = spreadsheet.sheets?.find(
    (item) => item.properties?.title === tabName,
  )?.properties?.sheetId;
  if (!Number.isInteger(sheetId)) {
    throw new Error(`Could not find the ${tabName} sheet.`);
  }
  await sheetsRequest(':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      }],
    }),
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.includes('application/json')) {
    throw new Error('Content-Type must be application/json.');
  }
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64 * 1024) {
      throw new Error('Request body is too large.');
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Request body must contain valid JSON.');
  }
}

function requireLocalOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) {
    throw new Error('Origin header is required for sheet edits.');
  }
  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error('Request origin is not allowed.');
  }
  if (process.env.VERCEL === '1') {
    const forwardedHost = request.headers['x-forwarded-host'];
    const allowedHost = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost ?? request.headers.host;
    const forwardedProto = request.headers['x-forwarded-proto'];
    const allowedProto = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto ?? 'https';
    if (
      !allowedHost ||
      originUrl.host !== allowedHost ||
      originUrl.protocol !== `${allowedProto}:`
    ) {
      throw new Error('Sheet edits are only allowed from this deployment.');
    }
    return;
  }
  if (originUrl.hostname !== 'localhost' && originUrl.hostname !== '127.0.0.1') {
    throw new Error('Sheet edits are only allowed from a local browser.');
  }
}

function validEditorPassword(request) {
  const authorization = request.headers.authorization;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  const tokenHash = createHash('sha256').update(token).digest();
  const expectedHash = createHash('sha256').update(sheetEditorPassword ?? '').digest();
  return Boolean(sheetEditorPassword) && timingSafeEqual(tokenHash, expectedHash);
}

function mapCharacters(valueRanges) {
  const [characterRange, statRange, skillRange] = valueRanges;
  const characters = readTable(characterRange, 'Characters');
  const stats = readTable(statRange, 'Stats');
  const skills = readTable(skillRange, 'Skills');
  const byId = new Map();

  for (const row of characters) {
    const id = requireText(row.id, 'id', 'Characters');
    if (byId.has(id)) {
      throw new Error(`Characters contains duplicate id "${id}".`);
    }
    byId.set(id, {
      id,
      name: requireText(row.name, 'name', 'Characters'),
      imageUrl: optionalImageUrl(row.imageUrl),
      backgroundTheme: backgroundTheme(row.backgroundTheme),
      palette: {
        primary: requireHexColor(row.primaryColor, 'primaryColor'),
        secondary: requireHexColor(row.secondaryColor, 'secondaryColor'),
      },
      stats: [],
      skills: [],
    });
  }

  for (const row of stats) {
    const characterId = requireText(row.characterId, 'characterId', 'Stats');
    const character = byId.get(characterId);
    if (!character) {
      throw new Error(`Stats references unknown character "${characterId}".`);
    }
    const stat = {
      name: requireText(row.name, 'name', 'Stats'),
      score: requireNumber(row.score, 'score', 'Stats'),
    };
    if (String(row.modifier ?? '').trim() !== '') {
      stat.modifier = requireNumber(row.modifier, 'modifier', 'Stats');
    }
    character.stats.push(stat);
  }

  for (const row of skills) {
    const characterId = requireText(row.characterId, 'characterId', 'Skills');
    const character = byId.get(characterId);
    if (!character) {
      throw new Error(`Skills references unknown character "${characterId}".`);
    }
    character.skills.push({
      name: requireText(row.name, 'name', 'Skills'),
      bonus: requireNumber(row.bonus, 'bonus', 'Skills'),
    });
  }

  return [...byId.values()];
}

async function fetchCharacters() {
  const accessToken = { token: await getGoogleAccessToken() };
  const parameters = new URLSearchParams();
  for (const tabName of Object.keys(requiredHeaders)) {
    parameters.append('ranges', `${tabName}!A:Z`);
  }
  parameters.set('majorDimension', 'ROWS');

  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`,
  );
  url.search = parameters.toString();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken.token}` },
  });
  if (!response.ok) {
    throw new Error(`Google Sheets API returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  const ranges = data.valueRanges ?? [];
  if (ranges.length !== Object.keys(requiredHeaders).length) {
    throw new Error('Google Sheets API did not return all configured tabs.');
  }

  return mapCharacters(ranges);
}

export async function handleApiRequest(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/api/characters') {
    try {
      sendJson(response, 200, await fetchCharacters());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      console.error(`Failed to load characters from Google Sheets: ${message}`);
      sendJson(response, 500, { error: 'Unable to load characters from the spreadsheet.' });
    }
    return;
  }

  const match = url.pathname.match(/^\/api\/sheets\/(Characters|Stats|Skills)(?:\/rows(?:\/(\d+))?)?$/);
  if (!match) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }
  const [, tabName, rowNumberText] = match;
  if (!sheetTabs.includes(tabName)) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }

  if (process.env.VERCEL === '1') {
    if (!sheetEditorPassword) {
      sendJson(response, 503, { error: 'Sheet editor is not configured for this deployment.' });
      return;
    }
    if (!validEditorPassword(request)) {
      sendJson(response, 401, { error: 'Enter the sheet editor password to continue.' });
      return;
    }
  }

  try {
    if (request.method === 'GET' && !rowNumberText) {
      sendJson(response, 200, await getEditableSheet(tabName));
      return;
    }
    if (request.method !== 'POST' && request.method !== 'DELETE') {
      sendJson(response, 405, { error: 'Method not allowed.' });
      return;
    }

    requireLocalOrigin(request);
    const body = await readJsonBody(request);
    if (request.method === 'POST' && !rowNumberText) {
      await appendSheetRow(tabName, body.values);
      sendJson(response, 201, { message: 'Row added.' });
    } else if (request.method === 'POST' && rowNumberText) {
      await updateSheetCell(tabName, Number(rowNumberText), body);
      sendJson(response, 200, { message: 'Cell updated.' });
    } else if (request.method === 'DELETE' && rowNumberText) {
      await deleteSheetRow(tabName, Number(rowNumberText), body);
      sendJson(response, 200, { message: 'Row deleted.' });
    } else {
      sendJson(response, 405, { error: 'Method not allowed.' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    console.error(`Failed to edit ${tabName} in Google Sheets: ${message}`);
    sendJson(response, 400, { error: message });
  }
}

if (process.env.VERCEL !== '1') {
  const server = createServer(handleApiRequest);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Character API listening on http://127.0.0.1:${port}`);
  });
}
