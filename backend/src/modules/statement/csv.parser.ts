import { parse } from 'csv-parse/sync';

export interface ParsedTransaction {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ParsedStatement {
  transactions: ParsedTransaction[];
  totalCredits: number;
  totalDebits: number;
  periodFrom: Date;
  periodTo: Date;
}

/**
 * Parses a bank statement CSV.
 * Supports standard format: Date, Description/Narration, Debit, Credit, Balance
 * Also handles: Date, Narration, Chq/Ref No, Value Dt, Withdrawal Amt, Deposit Amt, Closing Balance
 */
export function parseBankStatementCsv(buffer: Buffer): ParsedStatement {
  const content = buffer.toString('utf-8');
  let records: string[][];

  try {
    records = parse(content, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch {
    throw new Error('Failed to parse CSV — ensure it is a valid comma-separated file');
  }

  if (records.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Find header row (look for Date column)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, records.length); i++) {
    const row = records[i].map(c => c.toLowerCase());
    if (row.some(c => c.includes('date'))) { headerRowIdx = i; break; }
  }

  const headers = records[headerRowIdx].map(h => h.toLowerCase().trim());
  const dataRows = records.slice(headerRowIdx + 1);

  const isTextColumn = (h: string) =>
    h.includes('narration') || h.includes('description') ||
    h.includes('particulars') || h.includes('details');

  // Flexible column mapping (exclude text columns from dr/cr abbreviation matching)
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => isTextColumn(h));
  const debitIdx = headers.findIndex(h =>
    !isTextColumn(h) &&
    (h.includes('debit') || h.includes('withdrawal') || h === 'dr' || (h.includes('dr') && !h.includes('credit'))),
  );
  const creditIdx = headers.findIndex(h =>
    !isTextColumn(h) &&
    (h.includes('credit') || h.includes('deposit') || h === 'cr' || (h.includes('cr') && !h.includes('debit'))),
  );
  const balanceIdx = headers.findIndex(h =>
    h.includes('balance') || h.includes('closing'),
  );

  if (dateIdx === -1 || descIdx === -1) {
    throw new Error('Could not identify Date or Description columns in CSV');
  }

  const parseAmount = (val: string): number => {
    if (!val || val.trim() === '' || val.trim() === '-') return 0;
    return parseFloat(val.replace(/[,₹$\s]/g, '')) || 0;
  };

  const parseDate = (val: string): Date => {
    const cleaned = val.trim();
    // Try DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      /^(\d{2})-(\d{2})-(\d{4})$/,
    ];
    for (const fmt of formats) {
      const m = cleaned.match(fmt);
      if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
    }
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
    throw new Error(`Cannot parse date: ${cleaned}`);
  };

  const transactions: ParsedTransaction[] = [];

  for (const row of dataRows) {
    if (!row[dateIdx]?.trim()) continue;
    try {
      const debit = debitIdx !== -1 ? parseAmount(row[debitIdx]) : 0;
      const credit = creditIdx !== -1 ? parseAmount(row[creditIdx]) : 0;
      const balance = balanceIdx !== -1 ? parseAmount(row[balanceIdx]) : 0;

      if (debit === 0 && credit === 0 && balance === 0) continue;

      transactions.push({
        date: parseDate(row[dateIdx]),
        description: row[descIdx]?.trim() ?? '',
        debit,
        credit,
        balance,
      });
    } catch {
      // Skip unparseable rows silently
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found in the CSV');
  }

  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);
  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());

  return {
    transactions,
    totalCredits,
    totalDebits,
    periodFrom: dates[0],
    periodTo: dates[dates.length - 1],
  };
}
