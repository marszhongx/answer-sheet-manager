import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SubmitButton from "../components/SubmitButton";
import { Check, FileImage } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { gradeAnswers } from "../lib/grading";
import { answerOf, OPTION_LABELS, Option } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  const review = useAppStore((state) => state.review);
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
  const cancel = () => {
    useAppStore.getState().clearReview();
    navigate(`/exams/${exam.id}/scan`);
  };
  const save = async () => {
    if (!canSave) return;
    const studentNumber = review.recognition.studentNumber ?? "";
    const record = gradeAnswers(review.fileName, answers, recognition.confidence, studentNumber);
    const existing = exam.scanRecords.some((item) => item.studentNumber === studentNumber);
    await useAppStore.getState().updateExam({
      ...exam,
      scanRecords: existing
        ? exam.scanRecords.map((existingRecord) =>
            existingRecord.studentNumber === studentNumber ? record : existingRecord,
          )
        : [...exam.scanRecords, record],
    });
    useAppStore.getState().clearReview();
    useAppStore.getState().notify(existing ? "已更新该学生成绩" : "成绩已保存");
    navigate(`/exams/${exam.id}/results`);
  };
  return (
    <>
      <PageHeader title="确认识别结果" onBack={cancel} backLabel="取消本次识别" />
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
                answer === answerOf(answerSheet)[index]
                  ? "review-question correct"
                  : "review-question wrong"
              }
              key={index}
            >
              <div>
                <b>第 {index + 1} 题</b>
                <small>正确：{answerOf(answerSheet)[index]}</small>
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
        <SubmitButton icon={<Check size={19} />} disabled={!canSave} onClick={save}>
          {canSave ? "确认批改并保存" : "请先补全所有题目"}
        </SubmitButton>
        <small className="file-name">
          <FileImage size={14} />
          {fileName}
        </small>
      </main>
    </>
  );
}
