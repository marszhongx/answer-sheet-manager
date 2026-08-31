import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export type ExamDraft = {
  id: string;
  name: string;
  answerSheetId: string;
  classroomId: string;
  createdAt: string;
};

type Props = {
  onSave: (draft: ExamDraft) => void;
  onBack: () => void;
};
export default function NewExamPage({ onSave, onBack }: Props) {
  const { id } = useParams();
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
  const save = () => {
    if (!canSave) return;
    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: name.trim(),
      answerSheetId: exam?.answerSheetId ?? answerSheetId,
      classroomId: exam?.classroomId ?? classroomId,
      createdAt: exam?.createdAt ?? new Date().toISOString(),
    });
  };
  return (
    <>
      <PageHeader
        title={editing ? "编辑考试" : "新建考试"}
        onBack={onBack}
        backLabel="返回考试管理"
      />
      <main className="page new-answer-sheet-page">
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
              <p className="real-note">答题卡与班级在考试详情中编辑，此处仅修改考试名称。</p>
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
        <button className="create-answer-sheet-button" disabled={!canSave} onClick={save}>
          <Check size={19} />
          {editing ? "保存考试" : "创建考试"}
        </button>
        {!editing && (!answerSheets.length || !classrooms.length) && (
          <p className="real-note">请先创建答题卡，并在班级管理中创建班级。</p>
        )}
      </main>
    </>
  );
}
