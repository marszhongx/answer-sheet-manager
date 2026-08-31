import AddButton from "../components/AddButton";
import CardList from "../components/CardList";
import EmptyState from "../components/EmptyState";
import ListCard from "../components/ListCard";
import Page from "../components/Page";
import PageHeader from "../components/PageHeader";
import { FileText, LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { questionCount, questionPoints } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function AnswerSheetsPage() {
  const navigate = useNavigate();
  const answerSheetList = useAppStore((state) => state.answerSheetList);
  const templates = answerSheetList.filter((item) => item.isTemplate);
  return (
    <>
      <PageHeader
        title="答题卡"
        action={<AddButton label="新建答题卡" onClick={() => navigate("/answer-sheets/new")} />}
      />
      <Page>
        {templates.length === 0 ? (
          <EmptyState
            icon={<LayoutTemplate size={37} />}
            title="还没有答题卡"
            description="先创建一张标准答题卡，设置答案后即可打印并开始扫描阅卷。"
            actionLabel="新建答题卡"
            onAction={() => navigate("/answer-sheets/new")}
          />
        ) : (
          <CardList>
            {templates.map((answerSheet) => (
              <ListCard
                key={answerSheet.id}
                leading={<FileText size={22} />}
                tags={[answerSheet.subject]}
                title={answerSheet.name}
                description={`${questionCount(answerSheet)} 道单选题 · 共 ${questionPoints(answerSheet).reduce((sum, point) => sum + point, 0)} 分`}
                onClick={() => navigate(`/answer-sheets/${answerSheet.id}`)}
              />
            ))}
          </CardList>
        )}
      </Page>
    </>
  );
}
