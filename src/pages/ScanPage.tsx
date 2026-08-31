import FileUploader from "../components/FileUploader";
import PageHeader from "../components/PageHeader";
import { useState } from "react";
import { Camera, ChevronRight, ImagePlus, LayoutTemplate, ScanLine } from "lucide-react";
import { useParams } from "react-router-dom";
import LiveScanner from "../components/LiveScanner";
import { AnswerSheet, Recognition, recognizeAnswerSheet } from "../lib/omr";
import { Exam } from "../lib/exam";
import { useAppStore } from "../store/appStore";
import EmptyState from "./EmptyState";

type Props = {
  onBack: () => void;
  onSelect: () => void;
  onScanned: (exam: Exam, recognition: Recognition, fileName: string) => void;
  notify: (text: string) => void;
};
export default function ScanPage({ onBack, onSelect, onScanned, notify }: Props) {
  const { id } = useParams();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const exam = examMap[id ?? ""];
  const answerSheet: AnswerSheet | undefined = exam
    ? answerSheetMap[exam.answerSheetId]
    : undefined;
  const [processing, setProcessing] = useState(false);
  const [scanner, setScanner] = useState(false);
  const importImage = (file: File) => {
    if (!file || !answerSheet || !exam) return;
    setProcessing(true);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.addEventListener(
      "load",
      () => {
        try {
          onScanned(
            exam,
            recognizeAnswerSheet(image, image.naturalWidth, image.naturalHeight, answerSheet),
            file.name,
          );
        } finally {
          URL.revokeObjectURL(url);
          setProcessing(false);
        }
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        URL.revokeObjectURL(url);
        setProcessing(false);
        notify("图片无法读取");
      },
      { once: true },
    );
    image.src = url;
  };
  if (scanner && answerSheet && exam)
    return (
      <LiveScanner
        answerSheet={answerSheet}
        onClose={() => setScanner(false)}
        onConfirm={(recognition) => {
          setScanner(false);
          onScanned(exam, recognition, `camera-${Date.now()}.jpg`);
        }}
      />
    );
  return (
    <>
      <PageHeader title="扫描答卷" onBack={onBack} backLabel="返回考试详情" />
      <main className="page scan-page">
        {answerSheet ? (
          <>
            <button onClick={onSelect} className="exam-picker">
              <div className="exam-icon">
                <LayoutTemplate size={21} />
              </div>
              <div>
                <small>当前答题卡</small>
                <b>{answerSheet.name}</b>
                <span>
                  {answerSheet.subject} · {answerSheet.questionCount} 道单选题
                </span>
              </div>
              <ChevronRight size={19} />
            </button>
            <section className="scan-zone">
              <div className="scan-frame">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <Camera size={38} />
              </div>
              <h2>实时扫描答题卡</h2>
              <p>将系统生成答题卡的四个定位方块完整放入画面，系统会实时显示对错浮层。</p>
              <button onClick={() => setScanner(true)} className="scan-button">
                <Camera size={20} />
                打开实时相机
              </button>
              <FileUploader className="album-button" accept="image/*" onFile={importImage}>
                <ImagePlus size={19} />
                导入已拍摄答题卡
              </FileUploader>
            </section>
            {processing && (
              <p className="scan-tip">
                <ScanLine size={15} />
                正在读取答题卡真实填涂结果
              </p>
            )}
            <p className="real-note">
              导入图片只适用于正面、完整、未裁切的答题卡。倾斜拍摄请使用实时相机模式。
            </p>
          </>
        ) : (
          <EmptyState onCreate={onSelect} />
        )}
      </main>
    </>
  );
}
