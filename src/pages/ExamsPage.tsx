import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { ClipboardPlus, Plus, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export default function ExamsPage() {
  const navigate = useNavigate();
  const examList = useAppStore((state) => state.examList);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  return (
    <>
      <PageHeader
        title="考试管理"
        action={
          <button
            onClick={() => navigate("/exams/new")}
            className="create-mini"
            aria-label="新建考试"
          >
            <Plus size={20} />
          </button>
        }
      />
      <main className="page answerSheets-page">
        {examList.length ? (
          <div className="answer-sheet-list">
            {examList.map((exam) => (
              <ListCard
                key={exam.id}
                leading={<ScanLine size={21} />}
                tags={[
                  classroomMap[exam.classroomId]?.name ?? "未知班级",
                  answerSheetMap[exam.answerSheetId]?.name ?? "未知答题卡",
                ]}
                title={exam.name}
                description={`已阅 ${exam.scanRecords.length} 份`}
                onClick={() => navigate(`/exams/${exam.id}`)}
              />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <ClipboardPlus size={37} />
            <h2>还没有考试</h2>
            <p>选择答题卡和班级后创建考试，扫描成绩会保存到该考试中。</p>
            <button onClick={() => navigate("/exams/new")}>
              <Plus size={18} />
              新建考试
            </button>
          </section>
        )}
      </main>
    </>
  );
}
