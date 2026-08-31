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

export function parseStudentCSV(text: string): Array<{ name: string; studentNumber: string }> {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim()))
    .filter((row) => row.some(Boolean));
  if (!rows.length) return [];
  const header = rows[0];
  const nameIndex = header.findIndex((cell) => /^(姓名|学生姓名)$/.test(cell));
  const numberIndex = header.findIndex((cell) => /^(学号|学生学号)$/.test(cell));
  const data = nameIndex >= 0 && numberIndex >= 0 ? rows.slice(1) : rows;
  const nameColumn = nameIndex >= 0 ? nameIndex : 0;
  const numberColumn = numberIndex >= 0 ? numberIndex : 1;
  return data
    .map((row) => ({
      name: row[nameColumn]?.trim(),
      studentNumber: row[numberColumn]?.replace(/\D/g, ""),
    }))
    .filter((student) => student.name && student.studentNumber);
}

export function findStudent(
  classrooms: Classroom[],
  classroomId: string | undefined,
  studentNumber: string,
): Student | undefined {
  return classrooms
    .find((item) => item.id === classroomId)
    ?.students.find((student) => student.studentNumber === studentNumber);
}
