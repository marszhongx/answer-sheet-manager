import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import Note from "../components/Note";
import Page from "../components/Page";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import SubmitButton from "../components/SubmitButton";
import { Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Exam } from "../lib/exam";
import { newId } from "../lib/id";
import { AnswerSheet } from "../lib/omr";
import { Classroom } from "../lib/roster";
import { useAppStore } from "../store/appStore";

export default function NewExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const examMap = useAppStore((state) => state.examMap);
  const answerSheetList = useAppStore((state) => state.answerSheetList);
  const classroomList = useAppStore((state) => state.classroomList);
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const classroomMap = useAppStore((state) => state.classroomMap);
  const exam = examMap[id ?? ""];
  const answerSheets = answerSheetList.filter((item) => item.isTemplate);
  const classrooms = classroomList.filter((item) => item.isTemplate);
  const currentAnswerSheet = exam ? answerSheetMap[exam.answerSheetId] : undefined;
  const currentClassroom = exam ? classroomMap[exam.classroomId] : undefined;
  const [name, setName] = useState(exam?.name ?? "");
  const [answerSheetId, setAnswerSheetId] = useState(
    exam?.answerSheetId ?? answerSheets[0]?.id ?? "",
  );
  const [classroomId, setClassroomId] = useState(exam?.classroomId ?? classrooms[0]?.id ?? "");
  const editing = Boolean(exam);
  const canSave = Boolean(name.trim() && (editing || (answerSheetId && classroomId)));
  const save = async () => {
    if (!canSave) return;
    const store = useAppStore.getState();
    try {
      if (exam) {
        await store.updateExam({
          ...exam,
          name: name.trim(),
        });
        store.notify("考试已保存");
        navigate(`/exams/${exam.id}`);
        return;
      }
      const sourceSheet = answerSheetMap[answerSheetId];
      const sourceClassroom = classroomMap[classroomId];
      if (!sourceSheet || !sourceClassroom) return;
      const sheetCopy: AnswerSheet = {
        ...sourceSheet,
        id: newId(),
        isTemplate: false,
        sections: sourceSheet.sections.map((section) => ({
          ...section,
          questions: section.questions.map((question) => ({ ...question })),
        })),
      };
      const classroomCopy: Classroom = {
        ...sourceClassroom,
        id: newId(),
        isTemplate: false,
        students: sourceClassroom.students.map((student) => ({ ...student })),
      };
      await store.createAnswerSheet(sheetCopy);
      await store.createClassroom(classroomCopy);
      const nextExam: Exam = {
        id: newId(),
        name: name.trim(),
        answerSheetId: sheetCopy.id,
        classroomId: classroomCopy.id,
        scanRecords: [],
        createdAt: new Date().toISOString(),
      };
      await store.createExam(nextExam);
      store.notify("考试已创建");
      navigate(`/exams/${nextExam.id}`);
    } catch (error) {
      store.notify(error instanceof Error ? `保存失败：${error.message}` : "保存失败，请重试");
    }
  };
  return (
    <>
      <PageHeader
        title={editing ? "编辑考试" : "新建考试"}
        onBack={() => navigate("/exams")}
        backLabel="返回考试管理"
      />
      <Page>
        <FormSection>
          <label>
            考试名称
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：第一单元测验"
              autoFocus
            />
          </label>
          {editing ? (
            <>
              <label>
                答题卡
                <Select
                  value={currentAnswerSheet?.id ?? ""}
                  options={
                    currentAnswerSheet
                      ? [{ value: currentAnswerSheet.id, label: currentAnswerSheet.name }]
                      : []
                  }
                  onChange={() => undefined}
                  disabled
                  ariaLabel="答题卡"
                />
              </label>
              <label>
                班级
                <Select
                  value={currentClassroom?.id ?? ""}
                  options={
                    currentClassroom
                      ? [{ value: currentClassroom.id, label: currentClassroom.name }]
                      : []
                  }
                  onChange={() => undefined}
                  disabled
                  ariaLabel="班级"
                />
              </label>
              <Note>答题卡与班级在考试详情中编辑，此处仅修改考试名称。</Note>
            </>
          ) : (
            <>
              <label>
                答题卡模板
                <Select
                  value={answerSheetId}
                  onChange={setAnswerSheetId}
                  options={answerSheets.map((answerSheet) => ({
                    value: answerSheet.id,
                    label: answerSheet.name,
                  }))}
                  ariaLabel="答题卡模板"
                />
              </label>
              <label>
                班级模板
                <Select
                  value={classroomId}
                  onChange={setClassroomId}
                  options={classrooms.map((classroom) => ({
                    value: classroom.id,
                    label: classroom.name,
                  }))}
                  ariaLabel="班级模板"
                />
              </label>
            </>
          )}
        </FormSection>
        <SubmitButton icon={<Check size={19} />} disabled={!canSave} onClick={save}>
          {editing ? "保存考试" : "创建考试"}
        </SubmitButton>
        {!editing && (!answerSheets.length || !classrooms.length) && (
          <Note>请先创建答题卡，并在班级管理中创建班级。</Note>
        )}
      </Page>
    </>
  );
}
