/**
 * Tiny CSV reader for the roster import. Deliberately small: teachers paste
 * or upload a four-column sheet, we show them exactly what we understood,
 * and nothing is written until they confirm.
 */

export interface CSVStudentRow {
  fullName: string;
  rollNumber: string;
  grade: string;
  section: string;
}

export interface ParsedRow extends CSVStudentRow {
  line: number;
  error: string | null;
}

const HEADER_ALIASES: Record<string, keyof CSVStudentRow> = {
  "full name": "fullName",
  name: "fullName",
  student: "fullName",
  "roll number": "rollNumber",
  roll: "rollNumber",
  "roll no": "rollNumber",
  grade: "grade",
  class: "grade",
  standard: "grade",
  section: "section",
  division: "section",
};

export const CSV_TEMPLATE = "Full Name,Roll Number,Grade,Section\nAarti Kulkarni,1,6,B\nSuresh Patil,2,6,B\n";

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export interface ParseOptions {
  defaultGrade: string;
  defaultSection: string;
  /** Roll numbers already used in the class, so we can flag clashes. */
  existingRolls: number[];
}

export function parseStudentCSV(text: string, opts: ParseOptions): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const header = splitLine(lines[0]!).map((h) => h.toLowerCase());
  const looksLikeHeader = header.some((h) => h in HEADER_ALIASES);
  const map: (keyof CSVStudentRow | null)[] = looksLikeHeader
    ? header.map((h) => HEADER_ALIASES[h] ?? null)
    : ["fullName", "rollNumber", "grade", "section"];

  const body = looksLikeHeader ? lines.slice(1) : lines;
  const seenRolls = new Set<string>();
  const seenNames = new Set<string>();

  return body.map((line, i) => {
    const cells = splitLine(line);
    const row: CSVStudentRow = { fullName: "", rollNumber: "", grade: "", section: "" };
    map.forEach((key, idx) => {
      if (key) row[key] = cells[idx] ?? "";
    });

    const fullName = row.fullName.trim();
    const grade = (row.grade || opts.defaultGrade).trim();
    const section = (row.section || opts.defaultSection).trim().toUpperCase();
    const rollNumber = row.rollNumber.trim();

    let error: string | null = null;
    const rollNum = Number(rollNumber);
    if (!fullName) error = "csv_e_name";
    else if (!rollNumber || !Number.isInteger(rollNum) || rollNum <= 0) error = "csv_e_roll";
    else if (seenRolls.has(`${grade}${section}:${rollNumber}`)) error = "csv_e_duproll";
    else if (opts.existingRolls.includes(rollNum)) error = "csv_e_exists";
    else if (seenNames.has(fullName.toLowerCase())) error = "csv_e_dupname";
    else if (!grade || !section) error = "csv_e_class";

    seenRolls.add(`${grade}${section}:${rollNumber}`);
    seenNames.add(fullName.toLowerCase());

    return { line: i + 1, fullName, rollNumber, grade, section, error };
  });
}
