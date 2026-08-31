import { Navigate, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
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
import ScanPage from "./pages/ScanPage";
import StudentsPage from "./pages/StudentsPage";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/answer-sheets" replace />} />
        <Route path="/answer-sheets" element={<AnswerSheetsPage />} />
        <Route path="/answer-sheets/new" element={<NewAnswerSheetPage />} />
        <Route path="/answer-sheets/:id/preview" element={<AnswerSheetPreviewPage />} />
        <Route path="/answer-sheets/:id" element={<AnswerSheetDetailPage />} />
        <Route path="/answer-sheets/:id/edit" element={<NewAnswerSheetPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/new" element={<NewExamPage />} />
        <Route path="/exams/:id/edit" element={<NewExamPage />} />
        <Route path="/exams/:id/answer-sheet/edit" element={<NewAnswerSheetPage />} />
        <Route path="/exams/:id/classroom/edit" element={<ClassroomEditorPage />} />
        <Route path="/exams/:id" element={<ExamDetailPage />} />
        <Route path="/exams/:id/scan" element={<ScanPage />} />
        <Route path="/exams/:id/review" element={<ReviewPage />} />
        <Route path="/exams/:id/results" element={<AnalysisPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<ClassroomEditorPage />} />
        <Route path="/students/:id" element={<ClassroomDetailPage />} />
        <Route path="/students/:id/edit" element={<ClassroomEditorPage />} />
        <Route path="*" element={<Navigate to="/answer-sheets" replace />} />
      </Routes>
      <BottomNav />
      <Toast />
    </div>
  );
}
