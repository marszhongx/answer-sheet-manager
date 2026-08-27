import { useState } from "react";
import { Check, FileImage, X } from "lucide-react";
import { AnswerCardTemplate, OPTION_LABELS, Option, Recognition } from "../lib/omr";

type Props = {
  template: AnswerCardTemplate;
  recognition: Recognition;
  fileName: string;
  onSave: (answers: Array<Option | null>, confidence: number[]) => void;
  onCancel: () => void;
};
export default function ReviewPage({ template, recognition, fileName, onSave, onCancel }: Props) {
  const [answers, setAnswers] = useState(recognition.answers);
  const unresolved = answers.filter((answer) => answer === null).length;
  const canSave = unresolved === 0;
  return (
    <>
      <header className="page-top">
        <div>
          <h1>确认识别结果</h1>
          <p>{recognition.markerValid ? "定位标记校验通过" : "定位标记不完整，请人工确认"}</p>
        </div>
        <button className="header-icon" onClick={onCancel} aria-label="取消本次识别">
          <X size={21} />
        </button>
      </header>
      <main className="page review-page">
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
                answer === template.answers[index]
                  ? "review-question correct"
                  : "review-question wrong"
              }
              key={index}
            >
              <div>
                <b>第 {index + 1} 题</b>
                <small>正确：{template.answers[index]}</small>
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
          className="create-template-button"
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
