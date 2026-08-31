import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DetailPage from "../components/DetailPage";
import PageHeader from "../components/PageHeader";
import PrintPreview from "../components/PrintPreview";
import SubmitButton from "../components/SubmitButton";
import { drawA4PrintPage } from "../lib/omr";
import { useAppStore } from "../store/appStore";

export default function AnswerSheetPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const answerSheet = useAppStore((state) => state.answerSheetMap)[id ?? ""];
  const ref = useRef<HTMLCanvasElement>(null);
  const [printable, setPrintable] = useState(true);
  useEffect(() => {
    if (answerSheet && ref.current) setPrintable(drawA4PrintPage(ref.current, answerSheet));
  }, [answerSheet]);
  if (!answerSheet) return <Navigate to="/answer-sheets" replace />;
  const download = () => {
    if (!ref.current || !printable) return;
    const link = document.createElement("a");
    link.href = ref.current.toDataURL("image/png");
    link.download = `${answerSheet.name.replace(/[\\/:*?"<>|]/g, "_")}.png`;
    link.click();
    useAppStore.getState().notify("答题卡已下载");
  };
  return (
    <>
      <PageHeader title="预览答题卡" onBack={() => navigate(-1)} backLabel="返回答题卡详情" />
      <DetailPage>
        <PrintPreview
          printable={printable}
          errorText="答题卡内容超出 A4 纸张范围，无法预览和下载。"
        >
          <canvas ref={ref} />
        </PrintPreview>
        <SubmitButton icon={<Download size={19} />} disabled={!printable} onClick={download}>
          下载答题卡
        </SubmitButton>
      </DetailPage>
    </>
  );
}
