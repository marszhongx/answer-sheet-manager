import { create } from "zustand";
import { AnswerSheet, Recognition } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { Exam } from "../lib/exam";
import {
  createAnswerSheetService,
  deleteAnswerSheetService,
  fetchAnswerSheetListService,
  updateAnswerSheetService,
} from "../services/answerSheetService";
import {
  createClassroomService,
  deleteClassroomService,
  fetchClassroomListService,
  updateClassroomService,
} from "../services/classroomService";
import {
  createExamService,
  deleteExamService,
  fetchExamListService,
  updateExamService,
} from "../services/examService";

export type ReviewState = {
  examId: string;
  recognition: Recognition;
  fileName: string;
};

function toMap<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((item) => [item.id, item]));
}

type AppStore = {
  ready: boolean;
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
  initialize: () => Promise<void>;
  fetchAnswerSheetList: () => Promise<void>;
  fetchClassroomList: () => Promise<void>;
  fetchExamList: () => Promise<void>;
  createAnswerSheet: (answerSheet: AnswerSheet) => Promise<void>;
  updateAnswerSheet: (answerSheet: AnswerSheet) => Promise<void>;
  deleteAnswerSheet: (id: string) => Promise<void>;
  createClassroom: (classroom: Classroom) => Promise<void>;
  updateClassroom: (classroom: Classroom) => Promise<void>;
  deleteClassroom: (id: string) => Promise<void>;
  createExam: (exam: Exam) => Promise<void>;
  updateExam: (exam: Exam) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
};

let toastTimer: number | undefined;

export const useAppStore = create<AppStore>((set, get) => ({
  ready: false,
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
  initialize: async () => {
    const [answerSheets, classrooms, exams] = await Promise.all([
      fetchAnswerSheetListService(),
      fetchClassroomListService(),
      fetchExamListService(),
    ]);
    set({
      answerSheetList: answerSheets,
      answerSheetMap: toMap(answerSheets),
      classroomList: classrooms,
      classroomMap: toMap(classrooms),
      examList: exams,
      examMap: toMap(exams),
      ready: true,
    });
  },
  fetchAnswerSheetList: async () => {
    const list = await fetchAnswerSheetListService();
    set({ answerSheetList: list, answerSheetMap: toMap(list) });
  },
  fetchClassroomList: async () => {
    const list = await fetchClassroomListService();
    set({ classroomList: list, classroomMap: toMap(list) });
  },
  fetchExamList: async () => {
    const list = await fetchExamListService();
    set({ examList: list, examMap: toMap(list) });
  },
  createAnswerSheet: async (answerSheet) => {
    await createAnswerSheetService(answerSheet);
    await get().fetchAnswerSheetList();
  },
  updateAnswerSheet: async (answerSheet) => {
    await updateAnswerSheetService(answerSheet);
    await get().fetchAnswerSheetList();
  },
  deleteAnswerSheet: async (id) => {
    await deleteAnswerSheetService(id);
    await get().fetchAnswerSheetList();
  },
  createClassroom: async (classroom) => {
    await createClassroomService(classroom);
    await get().fetchClassroomList();
  },
  updateClassroom: async (classroom) => {
    await updateClassroomService(classroom);
    await get().fetchClassroomList();
  },
  deleteClassroom: async (id) => {
    await deleteClassroomService(id);
    await get().fetchClassroomList();
  },
  createExam: async (exam) => {
    await createExamService(exam);
    await get().fetchExamList();
  },
  updateExam: async (exam) => {
    await updateExamService(exam);
    await get().fetchExamList();
  },
  deleteExam: async (id) => {
    await deleteExamService(id);
    await get().fetchExamList();
  },
}));

useAppStore.getState().initialize();
