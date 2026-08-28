import { FileUp } from "lucide-react";
import { useState } from "react";
import { parseStudentCSV, Student } from "../lib/roster";
import EditableTable from "./EditableTable";
import FileUploader from "./FileUploader";
import Input from "./Input";
import styles from "./StudentRosterTable.module.css";

type Props = { students: Student[]; onChange: (students: Student[]) => void };

export default function StudentRosterTable({ students, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const importFile = async (file: File) => {
    const imported = parseStudentCSV(await file.text());
    if (!imported.length) {
      setError("未读取到姓名和学号，请使用 CSV 文件。");
      return;
    }
    const existing = new Set(students.map((student) => student.studentNumber));
    onChange([
      ...students,
      ...imported
        .filter((student) => !existing.has(student.studentNumber))
        .map((student) => ({ id: crypto.randomUUID(), ...student })),
    ]);
    setError(null);
  };

  return (
    <>
      <EditableTable
        rows={students}
        onChange={onChange}
        createRow={() => ({ id: crypto.randomUUID(), name: "", studentNumber: "" })}
        columns={[
          {
            key: "name",
            label: "学生姓名",
            render: (student, onValueChange) => (
              <Input
                size="sm"
                value={student.name}
                onChange={(event) => onValueChange(event.target.value)}
              />
            ),
          },
          {
            key: "studentNumber",
            label: "学号",
            render: (student, onValueChange) => (
              <Input
                size="sm"
                value={student.studentNumber}
                inputMode="numeric"
                placeholder="例如：88"
                onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ""))}
              />
            ),
          },
        ]}
        title="学生名单"
        actions={
          <FileUploader className={styles.import} accept=".csv,text/csv" onFile={importFile}>
            <FileUp size={17} />
            导入 CSV
          </FileUploader>
        }
      />
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
