import PageHeader from "../components/PageHeader";
import { BarChart3, Download } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  averageScore,
  correctCountOf,
  downloadCSV,
  questionRates,
  scoreOf,
  studentNameOf,
  toCSV,
  totalScoreOf,
} from "../lib/grading";
import { questionCount } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  const exam = examMap[id ?? ""];
  const answerSheet = exam ? answerSheetMap[exam.answerSheetId] : undefined;
  if (!exam || !answerSheet) return <Navigate to="/exams" replace />;
  const records = exam.scanRecords;
  const classroom = classroomMap[exam.classroomId];
  if (!records.length)
    return (
      <>
        <PageHeader title="阅卷记录" onBack={() => navigate(`/exams/${id}`)} backLabel="返回考试详情" />
        <main className="page analysis-page">
          <section className="analysis-empty">
            <BarChart3 size={34} />
            <h2>暂无阅卷记录</h2>
            <p>创建标准答题卡后，通过相机或导入图片完成识别和人工复核。</p>
          </section>
        </main>
      </>
    );
  const rates = questionRates(answerSheet, records);
  const average = averageScore(answerSheet, records);
  const totalScore = totalScoreOf(answerSheet);
  return (
    <>
      <PageHeader title="阅卷记录" onBack={() => navigate(`/exams/${id}`)} backLabel="返回考试详情" />
      <main className="page analysis-page">
        <section className="score-hero">
          <span>班级平均分</span>
          <b>{average.toFixed(1)}</b>
          <small>/ {totalScore} 分</small>
          <p>{records.length} 份真实识别答卷</p>
        </section>
        <section className="analysis-grid">
          <div>
            <b>{Math.max(...records.map((record) => scoreOf(answerSheet, record.answers)))}</b>
            <span>最高分</span>
          </div>
          <div>
            <b>{Math.min(...records.map((record) => scoreOf(answerSheet, record.answers)))}</b>
            <span>最低分</span>
          </div>
          <div>
            <b>{Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)}%</b>
            <span>平均正确率</span>
          </div>
        </section>
        <section className="analysis-section">
          <div className="section-head">
            <h2>题目正确率</h2>
            <span className="section-sub">真实识别</span>
          </div>
          {rates.map((rate, index) => (
            <div className="rate-row" key={index}>
              <span>第 {index + 1} 题</span>
              <div>
                <i className={rate < 60 ? "low" : ""} style={{ width: `${rate}%` }}></i>
              </div>
              <b>{rate}%</b>
            </div>
          ))}
        </section>
        <section className="analysis-section">
          <div className="section-head">
            <h2>成绩明细</h2>
            <button
              onClick={() =>
                downloadCSV(
                  `${answerSheet.name}-成绩表.csv`,
                  toCSV(answerSheet, records, classroom),
                )
              }
            >
              <Download size={13} />
              导出 CSV
            </button>
          </div>
          <div className="students-table">
            <div className="students-header">
              <span>姓名</span>
              <span>答对题数</span>
              <span>得分</span>
            </div>
            {records.map((record) => (
              <div className="student-row" key={record.fileName}>
                <span>{studentNameOf(classroom, record.studentNumber)}</span>
                <span>
                  {correctCountOf(answerSheet, record.answers)} / {questionCount(answerSheet)}
                </span>
                <b>{scoreOf(answerSheet, record.answers)}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
