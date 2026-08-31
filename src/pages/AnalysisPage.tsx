import PageHeader from "../components/PageHeader";
import { BarChart3, Download } from "lucide-react";
import { averageScore, downloadCSV, GradedStudent, questionRates, toCSV } from "../lib/grading";
import { AnswerCardTemplate, questionPoints } from "../lib/omr";

type Props = { template: AnswerCardTemplate | null; records: GradedStudent[]; onBack: () => void };
export default function AnalysisPage({ template, records, onBack }: Props) {
  if (!template || !records.length)
    return (
      <>
        <PageHeader title="阅卷记录" onBack={onBack} backLabel="返回考试详情" />
        <main className="page analysis-page">
          <section className="analysis-empty">
            <BarChart3 size={34} />
            <h2>暂无阅卷记录</h2>
            <p>创建标准答题卡后，通过相机或导入图片完成识别和人工复核。</p>
          </section>
        </main>
      </>
    );
  const rates = questionRates(records, template.questionCount);
  const average = averageScore(records);
  const totalScore = questionPoints(template).reduce((sum, point) => sum + point, 0);
  return (
    <>
      <PageHeader title="阅卷记录" onBack={onBack} backLabel="返回考试详情" />
      <main className="page analysis-page">
        <section className="score-hero">
          <span>班级平均分</span>
          <b>{average.toFixed(1)}</b>
          <small>/ {totalScore} 分</small>
          <p>{records.length} 份真实识别答卷</p>
        </section>
        <section className="analysis-grid">
          <div>
            <b>{Math.max(...records.map((record) => record.score))}</b>
            <span>最高分</span>
          </div>
          <div>
            <b>{Math.min(...records.map((record) => record.score))}</b>
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
              onClick={() => downloadCSV(`${template.name}-成绩表.csv`, toCSV(template, records))}
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
                <span>{record.name}</span>
                <span>
                  {record.correctCount} / {template.questionCount}
                </span>
                <b>{record.score}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
