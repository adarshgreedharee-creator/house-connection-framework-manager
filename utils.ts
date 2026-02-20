// utils.ts

// 1. Backend URL – paste your Apps Script Web App URL here:
const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbwkCvTSzri_TWXMQP6zcPiO5xPTqjGJOq77iVbXJcO_BHjfyqsvQryCUrejUZ9mhH7qnQ/exec';

// 2. This is the shared framework state structure we persist.
export type HCFrameworkState = any;

// 3. Save the whole framework state to Google Sheets backend
export async function saveFrameworkState(state: HCFrameworkState): Promise<void> {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}`);
  }
}

// 4. Load the framework state from Google Sheets backend
export async function loadFrameworkState(): Promise<HCFrameworkState | null> {
  try {
    const response = await fetch(BACKEND_URL);
    if (!response.ok) {
      console.error('Backend GET failed', response.status);
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      // Nothing saved yet
      return null;
    }

    return JSON.parse(text);
  } catch (err) {
    console.error('Error loading framework state', err);
    return null;
  }
}

// 5. Existing helpers – preserved

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

  if (!/^[0-9+\-*/().]+$/.test(cleanExpr)) return { ok: false, val: 0 };

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

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines
    .slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const entry: any = {};
      headers.forEach((header, i) => {
        entry[header] = values[i]?.trim() || '';
      });
      return entry;
    });
};
