import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { drawA4PrintPage } from "../lib/omr";
import { useAppStore } from "../store/appStore";

type Props = { onBack: () => void; notify: (text: string) => void };

export default function AnswerSheetPreviewPage({ onBack, notify }: Props) {
  const { id } = useParams();
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
    notify("答题卡已下载");
  };
  return (
    <>
      <PageHeader title="预览答题卡" onBack={onBack} backLabel="返回答题卡详情" />
      <main className="page detail-page preview-page">
        {printable ? (
          <div className="print-preview a4-preview">
            <canvas ref={ref} />
          </div>
        ) : (
          <div className="print-preview-error">答题卡内容超出 A4 纸张范围，无法预览和下载。</div>
        )}
        <button className="create-answer-sheet-button" onClick={download} disabled={!printable}>
          <Download size={19} />
          下载答题卡
        </button>
      </main>
    </>
  );
}
