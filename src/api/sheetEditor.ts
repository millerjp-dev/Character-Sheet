export const SHEET_TABS = ['Characters', 'Stats', 'Skills'] as const;

export type SheetTab = (typeof SHEET_TABS)[number];

export interface SheetRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface EditableSheet {
  tab: SheetTab;
  headers: string[];
  rows: SheetRow[];
}

export const SHEET_EDITOR_PASSWORD_KEY = 'sheet-editor-password';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const password = window.sessionStorage.getItem(SHEET_EDITOR_PASSWORD_KEY);
  if (password) {
    headers.set('Authorization', `Bearer ${password}`);
  }
  const response = await fetch(url, { ...init, headers });
  const payload: unknown = await response.json().catch(() => null);
  if (response.status === 401) {
    window.sessionStorage.removeItem(SHEET_EDITOR_PASSWORD_KEY);
  }
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Sheet request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

function jsonBody(value: unknown): RequestInit {
  return {
    body: JSON.stringify(value),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  };
}

export function fetchEditableSheet(tab: SheetTab): Promise<EditableSheet> {
  return request(`/api/sheets/${tab}`);
}

export function updateSheetCell(
  tab: SheetTab,
  row: SheetRow,
  column: string,
  value: string,
): Promise<{ message: string }> {
  return request(
    `/api/sheets/${tab}/rows/${row.rowNumber}`,
    jsonBody({ column, value, expectedValues: row.values }),
  );
}

export function addSheetRow(
  tab: SheetTab,
  values: Record<string, string>,
): Promise<{ message: string }> {
  return request(`/api/sheets/${tab}/rows`, jsonBody({ values }));
}

export function deleteSheetRow(row: SheetRow, tab: SheetTab): Promise<{ message: string }> {
  return request(
    `/api/sheets/${tab}/rows/${row.rowNumber}`,
    {
      ...jsonBody({ expectedValues: row.values }),
      method: 'DELETE',
    },
  );
}
