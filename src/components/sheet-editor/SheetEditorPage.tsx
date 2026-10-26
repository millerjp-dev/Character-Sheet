import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  addSheetRow,
  deleteSheetRow,
  fetchEditableSheet,
  SHEET_TABS,
  updateSheetCell,
} from '../../api/sheetEditor';
import type { EditableSheet, SheetRow, SheetTab } from '../../api/sheetEditor';
import { BACKGROUND_THEMES } from '../../context/CharacterContext';

const panelStyle = {
  background: 'rgba(24, 21, 17, 0.94)',
  border: '1px solid rgba(245, 231, 199, 0.2)',
  borderRadius: '12px',
  padding: '20px',
};

const inputStyle = {
  background: '#171512',
  border: '1px solid rgba(245, 231, 199, 0.3)',
  borderRadius: '6px',
  boxSizing: 'border-box' as const,
  color: '#f5e7c7',
  font: 'inherit',
  minWidth: 0,
  padding: '9px 10px',
  width: '100%',
};

function blankRow(headers: string[]): Record<string, string> {
  return Object.fromEntries(headers.map((header) => [header, '']));
}

function BackgroundThemeOptions() {
  return (
    <>
      <option value="">Use default (warm-parchment)</option>
      {BACKGROUND_THEMES.map((theme) => (
        <option key={theme} value={theme}>{theme}</option>
      ))}
    </>
  );
}

function SheetEditorPanel({
  onDelete,
  onEdit,
  sheet,
  disabled,
  selectedRowNumber,
}: {
  onDelete: (row: SheetRow) => void;
  onEdit: (row: SheetRow) => void;
  sheet: EditableSheet;
  disabled: boolean;
  selectedRowNumber: number | null;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', textAlign: 'left', whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Row</th>
            {sheet.headers.map((header) => <th key={header} style={cellStyle}>{header}</th>)}
            <th style={cellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row) => (
            <tr key={row.rowNumber}>
              <td style={cellStyle}>{row.rowNumber}</td>
              {sheet.headers.map((header) => (
                <td key={header} style={cellStyle}>{row.values[header]}</td>
              ))}
              <td style={cellStyle}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    aria-pressed={selectedRowNumber === row.rowNumber}
                    disabled={disabled}
                    onClick={() => onEdit(row)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button disabled={disabled} onClick={() => onDelete(row)} type="button">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {sheet.rows.length === 0 && (
            <tr><td colSpan={sheet.headers.length + 2} style={cellStyle}>No rows yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  borderBottom: '1px solid rgba(245, 231, 199, 0.16)',
  color: '#f5e7c7',
  padding: '10px 12px',
};

export function SheetEditorPage() {
  const [tab, setTab] = useState<SheetTab>('Characters');
  const [sheet, setSheet] = useState<EditableSheet | null>(null);
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [editValue, setEditValue] = useState('');
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSheet(null);
    setSelectedRow(null);
    setSelectedColumn('');
    setNewRow({});
    fetchEditableSheet(tab)
      .then((loadedSheet) => {
        if (active) {
          setSheet(loadedSheet);
          setNewRow(blankRow(loadedSheet.headers));
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this sheet.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tab, reloadVersion]);

  const editableColumns = sheet?.headers.filter(
    (header) => header !== 'id' && header !== 'characterId',
  ) ?? [];

  function chooseRow(row: SheetRow) {
    const column = editableColumns[0] ?? '';
    setSelectedRow(row);
    setSelectedColumn(column);
    setEditValue(column ? row.values[column] : '');
    setError(null);
    setStatus(null);
  }

  async function saveCell() {
    if (!selectedRow || !selectedColumn) {
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await updateSheetCell(tab, selectedRow, selectedColumn, editValue);
      setStatus('Cell updated in the spreadsheet.');
      setReloadVersion((version) => version + 1);
      setSelectedRow(null);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update this cell.');
    } finally {
      setBusy(false);
    }
  }

  async function createRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await addSheetRow(tab, newRow);
      setStatus('Row added to the spreadsheet.');
      setReloadVersion((version) => version + 1);
      setSelectedRow(null);
    } catch (addError: unknown) {
      setError(addError instanceof Error ? addError.message : 'Unable to add this row.');
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: SheetRow) {
    const displayName = row.values.name || `row ${row.rowNumber}`;
    if (!window.confirm(`Permanently delete ${displayName} from ${tab}?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await deleteSheetRow(row, tab);
      setStatus('Row deleted from the spreadsheet.');
      setReloadVersion((version) => version + 1);
      if (selectedRow?.rowNumber === row.rowNumber) {
        setSelectedRow(null);
      }
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this row.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ color: '#f5e7c7', display: 'grid', gap: '20px', margin: '0 auto 48px', maxWidth: '1200px', padding: '0 24px' }}>
      <header style={{ ...panelStyle, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
          Spreadsheet Editor
        </h1>
        <p style={{ marginBottom: 0 }}>
          Changes are written directly to Google Sheets. ID and character-reference columns are locked.
        </p>
      </header>

      <nav aria-label="Spreadsheet tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {SHEET_TABS.map((sheetTab) => (
          <button
            aria-pressed={tab === sheetTab}
            disabled={busy}
            key={sheetTab}
            onClick={() => {
              setTab(sheetTab);
              setStatus(null);
            }}
            type="button"
          >
            {sheetTab}
          </button>
        ))}
      </nav>

      {error && <p role="alert" style={{ ...panelStyle, borderColor: '#bd5d4c', margin: 0 }}>{error}</p>}
      {status && <p role="status" style={{ ...panelStyle, margin: 0 }}>{status}</p>}

      <section aria-labelledby="sheet-rows-heading" style={panelStyle}>
        <h2 id="sheet-rows-heading" style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
          {tab} rows
        </h2>
        {loading && <p aria-live="polite">Loading {tab}…</p>}
        {!loading && sheet && (
          <SheetEditorPanel
            onDelete={(row) => void removeRow(row)}
            onEdit={chooseRow}
            disabled={busy}
            selectedRowNumber={selectedRow?.rowNumber ?? null}
            sheet={sheet}
          />
        )}
      </section>

      {selectedRow && sheet && (
        <section aria-labelledby="edit-cell-heading" style={panelStyle}>
          <h2 id="edit-cell-heading" style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
            Edit row {selectedRow.rowNumber}
          </h2>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              Column
              <select
                onChange={(event) => {
                  setSelectedColumn(event.target.value);
                  setEditValue(selectedRow.values[event.target.value] ?? '');
                }}
                disabled={busy}
                style={inputStyle}
                value={selectedColumn}
              >
                {editableColumns.map((column) => <option key={column} value={column}>{column}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              New value
              {selectedColumn === 'backgroundTheme' ? (
                <select
                  aria-label="New value"
                  onChange={(event) => setEditValue(event.target.value)}
                  disabled={busy}
                  style={inputStyle}
                  value={editValue}
                >
                  <BackgroundThemeOptions />
                </select>
              ) : (
                <input
                  onChange={(event) => setEditValue(event.target.value)}
                  disabled={busy}
                  style={inputStyle}
                  value={editValue}
                />
              )}
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button disabled={busy || !selectedColumn} onClick={() => void saveCell()} type="button">
              {busy ? 'Saving…' : 'Save cell'}
            </button>
            <button disabled={busy} onClick={() => setSelectedRow(null)} type="button">Cancel</button>
          </div>
        </section>
      )}

      {sheet && (
        <section aria-labelledby="add-row-heading" style={panelStyle}>
          <h2 id="add-row-heading" style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
            Add {tab} row
          </h2>
          <form onSubmit={(event) => void createRow(event)}>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
              {sheet.headers.map((header) => (
                <label key={header} style={{ display: 'grid', gap: '6px' }}>
                  {header}
                  {header === 'backgroundTheme' ? (
                    <select
                      onChange={(event) => setNewRow((values) => ({ ...values, [header]: event.target.value }))}
                      disabled={busy}
                      style={inputStyle}
                      value={newRow[header] ?? ''}
                    >
                      <BackgroundThemeOptions />
                    </select>
                  ) : (
                    <input
                      onChange={(event) => setNewRow((values) => ({ ...values, [header]: event.target.value }))}
                      disabled={busy}
                      required={['id', 'name', 'primaryColor', 'secondaryColor', 'characterId', 'score', 'bonus'].includes(header)}
                      style={inputStyle}
                      value={newRow[header] ?? ''}
                    />
                  )}
                </label>
              ))}
            </div>
            {tab !== 'Characters' && (
              <p style={{ color: '#d8cbb1' }}>The character ID must match an existing row in Characters.</p>
            )}
            <button disabled={busy || loading} style={{ marginTop: '14px' }} type="submit">
              {busy ? 'Saving…' : `Add ${tab} row`}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
