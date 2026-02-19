
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MU', {
    style: 'currency',
    currency: 'MUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const safeEval = (expr: string): { ok: boolean; val: number } => {
  const cleanExpr = expr.replace(/×/g, '*').replace(/[xX]/g, '*').replace(/\s+/g, '');
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
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const entry: any = {};
    headers.forEach((header, i) => {
      entry[header] = values[i]?.trim() || '';
    });
    return entry;
  });
};
