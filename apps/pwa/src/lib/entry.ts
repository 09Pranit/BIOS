export const grades = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
export const villages = ['Dhareri', 'Daun Kalan', 'Baran', 'Lang'];
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const matchesChild = (child: Record<string, any>, query: string) => {
  const text = [child.name, child.id, child.guardian, child.village, child.class].join(' ').toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
};
export function parseScore(raw: string) {
  if (!raw.trim()) throw new Error('Enter a score.');
  const score = Number(raw);
  if (!Number.isFinite(score) || score < 0 || score > 100)
    throw new Error('Score must be between 0 and 100.');
  return score;
}
export type RosterRow = {
  name: string;
  dob: string;
  class: string;
  village: string;
  guardian: string;
  consent: true;
  row: number;
};
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (closed && !quoted && ![',', '\n', '\r', ' ', '\t'].includes(char))
      throw new Error('Unexpected characters after a quoted CSV field.');
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === '') {
        if (quoted) closed = true;
        quoted = !quoted;
      } else throw new Error('Unexpected quote in CSV. Quote the complete field.');
    } else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
      closed = false;
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      cells.push(cell);
      if (cells.some((c) => c.trim())) rows.push(cells);
      cells = [];
      cell = '';
      closed = false;
    } else cell += char;
  }
  if (quoted) throw new Error('A quoted CSV field was not closed.');
  cells.push(cell);
  if (cells.some((c) => c.trim())) rows.push(cells);
  return rows;
}
export const rosterKey = (row: { name?: any; dob?: any; village?: any }) =>
  [row.name, row.dob, row.village]
    .map((v) =>
      String(v ?? '')
        .trim()
        .toLowerCase(),
    )
    .join('|');
export function parseRoster(text: string): RosterRow[] {
  if (text.length > 250000) throw new Error('CSV is too large. Import up to 100 children at a time.');
  const rows = csvRows(text),
    headers = rows.shift()?.map((h) => h.trim().toLowerCase());
  if (!headers || ['name', 'dob', 'class', 'village', 'consent'].some((h) => !headers.includes(h)))
    throw new Error('Required CSV columns: name, dob, class, village, consent. guardian is optional.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV has repeated column headers.');
  if (headers.some((h) => !['name', 'dob', 'class', 'village', 'consent', 'guardian'].includes(h)))
    throw new Error('Use the template columns only: name, dob, class, village, guardian, consent.');
  if (!rows.length || rows.length > 100) throw new Error('Import between 1 and 100 children at a time.');
  const seen = new Set<string>();
  return rows.map((cells, i) => {
    const row = i + 2,
      value: Record<string, string> = {};
    if (cells.length !== headers.length)
      throw new Error(`Row ${row}: column count does not match the header.`);
    headers.forEach((header, n) => {
      value[header] = cells[n].trim();
    });
    if (value.name.length < 2 || value.name.length > 80)
      throw new Error(`Row ${row}: name must contain 2–80 characters.`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value.dob) ||
      !Number.isFinite(Date.parse(value.dob)) ||
      new Date(value.dob).toISOString().slice(0, 10) !== value.dob ||
      value.dob > localDate()
    )
      throw new Error(`Row ${row}: enter a valid date of birth as YYYY-MM-DD.`);
    if (!grades.includes(value.class)) throw new Error(`Row ${row}: class must be Class 1 through Class 5.`);
    if (!villages.includes(value.village)) throw new Error(`Row ${row}: use a village from the template.`);
    if (value.consent.toLowerCase() !== 'true')
      throw new Error(`Row ${row}: consent must be explicitly true.`);
    if ((value.guardian ?? '').length > 80)
      throw new Error(`Row ${row}: guardian name exceeds 80 characters.`);
    const key = rosterKey(value);
    if (seen.has(key))
      throw new Error(`Row ${row}: repeated child name, birth date and village within the CSV.`);
    seen.add(key);
    return {
      name: value.name,
      dob: value.dob,
      class: value.class,
      village: value.village,
      guardian: value.guardian ?? '',
      consent: true,
      row,
    };
  });
}
export function toCSV(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? '');
          if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
          return '"' + text.replace(/"/g, '""') + '"';
        })
        .join(','),
    )
    .join('\r\n');
}
export function downloadCSV(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + toCSV(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
