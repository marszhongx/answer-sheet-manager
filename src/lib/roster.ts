export type Student = {
  id: string;
  name: string;
  studentNumber: string;
};

export type ClassRoster = {
  id: string;
  name: string;
  students: Student[];
};

export function findStudent(
  classes: ClassRoster[],
  classId: string | undefined,
  studentNumber: string,
): Student | undefined {
  return classes
    .find((item) => item.id === classId)
    ?.students.find((student) => student.studentNumber === studentNumber);
}
