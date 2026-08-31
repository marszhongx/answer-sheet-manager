import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { Check, FileImage } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { OPTION_LABELS, Option, Recognition } from "../lib/omr";
import { Exam } from "../lib/exam";
import { useAppStore } from "../store/appStore";

type ReviewState = { examId: string; recognition: Recognition; fileName: string };
type Props = {
  review: ReviewState | null;
  onSave: (exam: Exam, answers: Array<Option | null>, confidence: number[]) => void;
  onCancel: (exam: Exam) => void;
};
export default function ReviewPage({ review, onSave, onCancel }: Props) {
  const { id } = useParams();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  const exam = examMap[id ?? ""];
  const answerSheet = exam ? answerSheetMap[exam.answerSheetId] : undefined;
  const classroom = exam ? classroomMap[exam.classroomId] : undefined;
  const student = classroom?.students.find(
    (item) => item.studentNumber === review?.recognition.studentNumber,
  );
  const recognition = review?.recognition;
  const fileName = review?.fileName ?? "answer-sheet.jpg";
  const [answers, setAnswers] = useState<Array<Option | null>>(recognition?.answers ?? []);
  if (!exam || !answerSheet || !classroom || !student || !recognition || review?.examId !== exam.id)
    return <Navigate to="/exams" replace />;
  const unresolved = answers.filter((answer) => answer === null).length;
  const canSave = unresolved === 0;
  return (
    <>
      <PageHeader title="确认识别结果" onBack={() => onCancel(exam)} backLabel="取消本次识别" />
      <main className="page review-page">
        <div className={recognition.markerValid ? "review-status pass" : "review-status warning"}>
          <Check size={19} />
          <span>
            已识别：{classroom.name} · {student.studentNumber} · {student.name}
          </span>
        </div>
        <div className={recognition.markerValid ? "review-status pass" : "review-status warning"}>
          <Check size={19} />
          <span>
            {unresolved ? `${unresolved} 题未识别，请手动选择` : "全部题目已识别，可确认批改"}
          </span>
        </div>
        <section className="review-grid">
          {answers.map((answer, index) => (
            <div
              className={
                answer === answerSheet.answers[index]
                  ? "review-question correct"
                  : "review-question wrong"
              }
              key={index}
            >
              <div>
                <b>第 {index + 1} 题</b>
                <small>正确：{answerSheet.answers[index]}</small>
              </div>
              <div>
                {OPTION_LABELS.map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((current) =>
                        current.map((value, item) => (item === index ? option : value)),
                      )
                    }
                    className={answer === option ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
        <button
          onClick={() => canSave && onSave(exam, answers, recognition.confidence)}
          disabled={!canSave}
          className="create-answer-sheet-button"
        >
          <Check size={19} />
          {canSave ? "确认批改并保存" : "请先补全所有题目"}
        </button>
        <small className="file-name">
          <FileImage size={14} />
          {fileName}
        </small>
      </main>
    </>
  );
}
