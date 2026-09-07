export type Student = {
  id: string;
  name: string;
  studentNumber: string;
};

export type Classroom = {
  id: string;
  name: string;
  students: Student[];
  isTemplate: boolean;
};

// 学号统一按“纯数字、忽略前导零”比较：名单常由 Excel/CSV 导入（"01" 会被存成 "1"），
// 而识别出的准考证号是固定位宽（如 "01"），直接全等比较会永远匹配不上。
export function normalizeStudentNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^0+/, "") || digits;
}

export function sameStudentNumber(a: string, b: string): boolean {
  return normalizeStudentNumber(a) === normalizeStudentNumber(b);
}

export function parseStudentCSV(text: string): Array<{ name: string; studentNumber: string }> {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim()))
    .filter((row) => row.some(Boolean));
  if (!rows.length) return [];
  const header = rows[0] ?? [];
  const nameIndex = header.findIndex((cell) => /^(姓名|学生姓名)$/.test(cell));
  const numberIndex = header.findIndex((cell) => /^(学号|学生学号)$/.test(cell));
  const data = nameIndex >= 0 && numberIndex >= 0 ? rows.slice(1) : rows;
  const nameColumn = nameIndex >= 0 ? nameIndex : 0;
  const numberColumn = numberIndex >= 0 ? numberIndex : 1;
  return data
    .map((row) => ({
      name: row[nameColumn]?.trim() ?? "",
      studentNumber: row[numberColumn]?.replace(/\D/g, "") ?? "",
    }))
    .filter((student) => student.name && student.studentNumber);
}

export function findStudentByNumber(
  classroom: Classroom | undefined,
  studentNumber: string,
): Student | undefined {
  return classroom?.students.find((student) =>
    sameStudentNumber(student.studentNumber, studentNumber),
  );
}
