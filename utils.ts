// utils.ts

// 1. Backend URL – your Apps Script Web App endpoint
const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbwzsMf7cgcwMB21AOIoLrlIfF-0KUAlmplV-ve2A3G_bMjELGlPrf9CKqS3Ebi-lsh8/exec';

export type HCFrameworkState = {
  records: any[];
  activities: any[];
  // add any other top-level state if needed
};

// 2. Save the whole framework state to Google Sheets backend
export async function saveFrameworkState(
  state: HCFrameworkState
): Promise<void> {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    throw new Error(`Save failed (${response.status})`);
  }
}

// 3. Load the framework state from Google Sheets backend
export async function loadFrameworkState(): Promise<HCFrameworkState | null> {
  try {
    const response = await fetch(BACKEND_URL, { method: 'GET' });
    if (!response.ok) return null;
    return (await response.json()) as HCFrameworkState;
  } catch (err) {
    console.error('loadFrameworkState error', err);
    return null;
  }
}

// 4. Existing helpers – preserved

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MU', {
    style: 'currency',
    currency: 'MUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const safeEval = (expr: string): { ok: boolean; val: number } => {
  const cleanExpr = expr
    .replace(/×/g, '*')
    .replace(/[xX]/g, '*')
    .replace(/\s+/g, '');

  if (!cleanExpr) return { ok: true, val: 0 };

  if (!/^[0-9+\-*/().]+$/.test(cleanExpr)) {
    return { ok: false, val: 0 };
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${cleanExpr})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return { ok: true, val: result };
    }
    return { ok: false, val: 0 };
  } catch {
    return { ok: false, val: 0 };
  }
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseCSV = (text: string): any[] => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(',');
      const entry: any = {};
      headers.forEach((header, i) => {
        entry[header] = values[i]?.trim() || '';
      });
      return entry;
    });
};
