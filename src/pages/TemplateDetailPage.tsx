import { useEffect, useRef } from "react";
import { Camera, Check, Download, X } from "lucide-react";
import { AnswerCardTemplate, drawAnswerCard } from "../lib/omr";

type Props = {
  template: AnswerCardTemplate;
  onBack: () => void;
  onAnswers: () => void;
  onScan: () => void;
  notify: (text: string) => void;
};
export default function TemplateDetailPage({ template, onBack, onAnswers, onScan, notify }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawAnswerCard(ref.current, template);
  }, [template]);
  const download = () => {
    if (!ref.current) return;
    const link = document.createElement("a");
    link.href = ref.current.toDataURL("image/png");
    link.download = `${template.name}-答题卡.png`;
    link.click();
    notify("答题卡 PNG 已下载，可直接打印");
  };
  return (
    <>
      <header className="page-top">
        <div>
          <h1>{template.name}</h1>
          <p>
            {template.subject} · {template.questionCount} 道题
          </p>
        </div>
        <button aria-label="返回答题卡列表" className="header-icon" onClick={onBack}>
          <X size={21} />
        </button>
      </header>
      <main className="page detail-page">
        <div className="print-preview">
          <canvas ref={ref} />
        </div>
        <section className="detail-actions">
          <button onClick={onAnswers}>
            <Check size={19} />
            设置标准答案
          </button>
          <button onClick={download}>
            <Download size={19} />
            下载打印答题卡
          </button>
          <button className="primary-action" onClick={onScan}>
            <Camera size={19} />
            开始扫描阅卷
          </button>
        </section>
        <p className="real-note">
          答题卡四角的黑色定位方块必须完整打印且拍摄时清晰可见，识别器会据此校正纸张角度。
        </p>
      </main>
    </>
  );
}
