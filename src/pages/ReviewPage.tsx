import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { Check, FileImage } from "lucide-react";
import { AnswerSheet, OPTION_LABELS, Option, Recognition } from "../lib/omr";

type Props = {
  answerSheet: AnswerSheet;
  recognition: Recognition;
  fileName: string;
  studentName: string;
  studentNumber: string;
  className: string;
  onSave: (answers: Array<Option | null>, confidence: number[]) => void;
  onCancel: () => void;
};
export default function ReviewPage({
  answerSheet,
  recognition,
  fileName,
  studentName,
  studentNumber,
  className,
  onSave,
  onCancel,
}: Props) {
  const [answers, setAnswers] = useState(recognition.answers);
  const unresolved = answers.filter((answer) => answer === null).length;
  const canSave = unresolved === 0;
  return (
    <>
      <PageHeader title="确认识别结果" onBack={onCancel} backLabel="取消本次识别" />
      <main className="page review-page">
        <div className={recognition.markerValid ? "review-status pass" : "review-status warning"}>
          <Check size={19} />
          <span>
            已识别：{className} · {studentNumber} · {studentName}
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
          onClick={() => canSave && onSave(answers, recognition.confidence)}
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
