import { create } from "zustand";
import { AnswerSheet, Recognition } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { Exam } from "../lib/exam";

const ANSWER_SHEETS_KEY = "answer-sheet-manager.answerSheets";
const CLASSROOMS_KEY = "answer-sheet-manager.classrooms";
const EXAMS_KEY = "answer-sheet-manager.exams";

export type ReviewState = {
  examId: string;
  recognition: Recognition;
  fileName: string;
};

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function persist(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    console.warn(`本地存储失败：${key}`);
    return false;
  }
}

function toMap<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((item) => [item.id, item]));
}

type AppStore = {
  answerSheetList: AnswerSheet[];
  classroomList: Classroom[];
  examList: Exam[];
  answerSheetMap: Record<string, AnswerSheet>;
  classroomMap: Record<string, Classroom>;
  examMap: Record<string, Exam>;
  message: string | null;
  notify: (text: string) => void;
  review: ReviewState | null;
  startReview: (examId: string, recognition: Recognition, fileName: string) => boolean;
  clearReview: () => void;
  fetchAnswerSheetList: () => void;
  fetchClassroomList: () => void;
  fetchExamList: () => void;
  createAnswerSheet: (answerSheet: AnswerSheet) => void;
  updateAnswerSheet: (answerSheet: AnswerSheet) => void;
  deleteAnswerSheet: (id: string) => void;
  createClassroom: (classroom: Classroom) => void;
  updateClassroom: (classroom: Classroom) => void;
  deleteClassroom: (id: string) => void;
  createExam: (exam: Exam) => void;
  updateExam: (exam: Exam) => void;
  deleteExam: (id: string) => void;
};

let toastTimer: number | undefined;

export const useAppStore = create<AppStore>((set, get) => ({
  answerSheetList: [],
  classroomList: [],
  examList: [],
  answerSheetMap: {},
  classroomMap: {},
  examMap: {},
  message: null,
  notify: (text) => {
    set({ message: text });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => set({ message: null }), 2200);
  },
  review: null,
  startReview: (examId, recognition, fileName) => {
    if (!recognition.markerValid || !recognition.studentNumber) return false;
    const exam = get().examMap[examId];
    const classroom = exam ? get().classroomMap[exam.classroomId] : undefined;
    const student = classroom?.students.find(
      (item) => item.studentNumber === recognition.studentNumber,
    );
    if (!student) return false;
    set({ review: { examId, recognition, fileName } });
    return true;
  },
  clearReview: () => set({ review: null }),
  fetchAnswerSheetList: () => {
    const list = load<AnswerSheet[]>(ANSWER_SHEETS_KEY, []);
    set({ answerSheetList: list, answerSheetMap: toMap(list) });
  },
  fetchClassroomList: () => {
    const list = load<Classroom[]>(CLASSROOMS_KEY, []);
    set({ classroomList: list, classroomMap: toMap(list) });
  },
  fetchExamList: () => {
    const list = load<Exam[]>(EXAMS_KEY, []);
    set({ examList: list, examMap: toMap(list) });
  },
  createAnswerSheet: (answerSheet) => {
    persist(ANSWER_SHEETS_KEY, [answerSheet, ...get().answerSheetList]);
    get().fetchAnswerSheetList();
  },
  updateAnswerSheet: (answerSheet) => {
    persist(
      ANSWER_SHEETS_KEY,
      get().answerSheetList.map((item) => (item.id === answerSheet.id ? answerSheet : item)),
    );
    get().fetchAnswerSheetList();
  },
  deleteAnswerSheet: (id) => {
    persist(
      ANSWER_SHEETS_KEY,
      get().answerSheetList.filter((item) => item.id !== id),
    );
    get().fetchAnswerSheetList();
  },
  createClassroom: (classroom) => {
    persist(CLASSROOMS_KEY, [classroom, ...get().classroomList]);
    get().fetchClassroomList();
  },
  updateClassroom: (classroom) => {
    persist(
      CLASSROOMS_KEY,
      get().classroomList.map((item) => (item.id === classroom.id ? classroom : item)),
    );
    get().fetchClassroomList();
  },
  deleteClassroom: (id) => {
    persist(CLASSROOMS_KEY, get().classroomList.filter((item) => item.id !== id));
    get().fetchClassroomList();
  },
  createExam: (exam) => {
    persist(EXAMS_KEY, [exam, ...get().examList]);
    get().fetchExamList();
  },
  updateExam: (exam) => {
    persist(EXAMS_KEY, get().examList.map((item) => (item.id === exam.id ? exam : item)));
    get().fetchExamList();
  },
  deleteExam: (id) => {
    persist(EXAMS_KEY, get().examList.filter((item) => item.id !== id));
    get().fetchExamList();
  },
}));

useAppStore.getState().fetchAnswerSheetList();
useAppStore.getState().fetchClassroomList();
useAppStore.getState().fetchExamList();
