import { Student } from "../lib/roster";
import styles from "./StudentTable.module.css";

type Props = { students: Student[] };

export default function StudentTable({ students }: Props) {
  return (
    <div className={styles.table} role="table">
      <div className={styles.header} role="row">
        <span role="columnheader">学生姓名</span>
        <span role="columnheader">学号</span>
      </div>
      {students.map((student) => (
        <div className={styles.row} role="row" key={student.id}>
          <span role="cell">{student.name}</span>
          <b role="cell">{student.studentNumber}</b>
        </div>
      ))}
    </div>
  );
}
