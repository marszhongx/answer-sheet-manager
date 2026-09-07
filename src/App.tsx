import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import EmptyState from "./components/EmptyState";
import Page from "./components/Page";
import Toast from "./components/Toast";
import { useAppStore } from "./store/appStore";
import styles from "./App.module.css";
import AnalysisPage from "./pages/AnalysisPage";
import AnswerSheetDetailPage from "./pages/AnswerSheetDetailPage";
import AnswerSheetPreviewPage from "./pages/AnswerSheetPreviewPage";
import AnswerSheetsPage from "./pages/AnswerSheetsPage";
import ClassroomDetailPage from "./pages/ClassroomDetailPage";
import ClassroomEditorPage from "./pages/ClassroomEditorPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamsPage from "./pages/ExamsPage";
import NewAnswerSheetPage from "./pages/NewAnswerSheetPage";
import NewExamPage from "./pages/NewExamPage";
import ReviewPage from "./pages/ReviewPage";
import StudentsPage from "./pages/StudentsPage";

const ScanPage = lazy(() => import("./pages/ScanPage"));

export default function App() {
  const ready = useAppStore((state) => state.ready);
  const error = useAppStore((state) => state.error);
  const { pathname } = useLocation();
  // 新建页与编辑页共用同一组件，靠 pathname 作 key 才能在两条路由间切换时重建实例，
  // 否则 React 会复用组件、useState 的初始值不刷新，编辑页会显示上一次的空表单。
  const formKey = pathname;
  if (error)
    return (
      <div className={styles.shell}>
        <Page>
          <EmptyState
            card
            title="数据加载失败"
            description={error}
            actionLabel="重新加载"
            onAction={() => {
              useAppStore.setState({ error: null });
              useAppStore.getState().initialize();
            }}
          />
        </Page>
      </div>
    );
  if (!ready)
    return (
      <div className={styles.shell}>
        <Page>
          <EmptyState card title="正在加载数据…" />
        </Page>
      </div>
    );
  return (
    <div className={styles.shell}>
      <Routes>
        <Route path="/" element={<Navigate to="/answer-sheets" replace />} />
        <Route path="/answer-sheets" element={<AnswerSheetsPage />} />
        <Route path="/answer-sheets/new" element={<NewAnswerSheetPage key={formKey} />} />
        <Route path="/answer-sheets/:id/preview" element={<AnswerSheetPreviewPage />} />
        <Route path="/answer-sheets/:id" element={<AnswerSheetDetailPage />} />
        <Route path="/answer-sheets/:id/edit" element={<NewAnswerSheetPage key={formKey} />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/new" element={<NewExamPage key={formKey} />} />
        <Route path="/exams/:id/edit" element={<NewExamPage key={formKey} />} />
        <Route path="/exams/:id/answer-sheet/edit" element={<NewAnswerSheetPage key={formKey} />} />
        <Route path="/exams/:id/answer-sheet/preview" element={<AnswerSheetPreviewPage />} />
        <Route path="/exams/:id/classroom/edit" element={<ClassroomEditorPage key={formKey} />} />
        <Route path="/exams/:id" element={<ExamDetailPage />} />
        <Route
          path="/exams/:id/scan"
          element={
            <Suspense fallback={<EmptyState card title="正在加载扫描功能…" />}>
              <ScanPage />
            </Suspense>
          }
        />
        <Route path="/exams/:id/review" element={<ReviewPage />} />
        <Route path="/exams/:id/results" element={<AnalysisPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<ClassroomEditorPage key={formKey} />} />
        <Route path="/students/:id" element={<ClassroomDetailPage />} />
        <Route path="/students/:id/edit" element={<ClassroomEditorPage key={formKey} />} />
        <Route path="*" element={<Navigate to="/answer-sheets" replace />} />
      </Routes>
      <BottomNav />
      <Toast />
    </div>
  );
}
