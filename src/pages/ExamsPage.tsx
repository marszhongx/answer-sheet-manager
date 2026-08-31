import AddButton from "../components/AddButton";
import EmptyState from "../components/EmptyState";
import ListCard from "../components/ListCard";
import PageHeader from "../components/PageHeader";
import { ClipboardPlus, ScanLine } from "lucide-react";
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
        action={<AddButton label="新建考试" onClick={() => navigate("/exams/new")} />}
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
          <EmptyState
            icon={<ClipboardPlus size={37} />}
            title="还没有考试"
            description="选择答题卡和班级后创建考试，扫描成绩会保存到该考试中。"
            actionLabel="新建考试"
            onAction={() => navigate("/exams/new")}
          />
        )}
      </main>
    </>
  );
}
