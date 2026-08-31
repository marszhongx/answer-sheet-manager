import { create } from "zustand";
import { AnswerSheet } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { Exam } from "../lib/exam";

const ANSWER_SHEETS_KEY = "answer-sheet-manager.answerSheets";
const CLASSROOMS_KEY = "answer-sheet-manager.classrooms";
const EXAMS_KEY = "answer-sheet-manager.exams";

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
  fetchAnswerSheetList: () => void;
  fetchClassroomList: () => void;
  fetchExamList: () => void;
};

export const useAppStore = create<AppStore>((set) => ({
  answerSheetList: [],
  classroomList: [],
  examList: [],
  answerSheetMap: {},
  classroomMap: {},
  examMap: {},
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
}));

function refresh() {
  useAppStore.getState().fetchAnswerSheetList();
  useAppStore.getState().fetchClassroomList();
  useAppStore.getState().fetchExamList();
}

export function saveAnswerSheetList(list: AnswerSheet[]): boolean {
  const ok = persist(ANSWER_SHEETS_KEY, list);
  if (ok) useAppStore.getState().fetchAnswerSheetList();
  return ok;
}

export function saveClassroomList(list: Classroom[]): boolean {
  const ok = persist(CLASSROOMS_KEY, list);
  if (ok) useAppStore.getState().fetchClassroomList();
  return ok;
}

export function saveExamList(list: Exam[]): boolean {
  const ok = persist(EXAMS_KEY, list);
  if (ok) useAppStore.getState().fetchExamList();
  return ok;
}

refresh();
