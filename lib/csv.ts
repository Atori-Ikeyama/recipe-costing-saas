export type CsvValue = string | number | boolean | null | undefined;

function escapeValue(value: CsvValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  if (/["\n,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(
  rows: Array<Record<string, CsvValue>>,
  headers?: string[],
): string {
  if (rows.length === 0 && (!headers || headers.length === 0)) {
    return '';
  }

  const headerKeys = headers ?? Object.keys(rows[0] ?? {});
  const lines: string[] = [];

  lines.push(headerKeys.map(escapeValue).join(','));

  for (const row of rows) {
    const values = headerKeys.map((key) => escapeValue(row[key]));
    lines.push(values.join(','));
  }

  return `${lines.join('\n')}\n`;
}
