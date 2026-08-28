import { useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { Check } from "lucide-react";
import { AnswerCardTemplate } from "../lib/omr";
import { ClassRoster } from "../lib/roster";
import { Exam } from "../lib/exam";

type Props = {
  exam?: Exam;
  templates: AnswerCardTemplate[];
  classes: ClassRoster[];
  onSave: (exam: Exam) => void;
  onBack: () => void;
};
export default function NewExamPage({ exam, templates, classes, onSave, onBack }: Props) {
  const [name, setName] = useState(exam?.name ?? "");
  const [templateId, setTemplateId] = useState(exam?.template.id ?? templates[0]?.id ?? "");
  const [classId, setClassId] = useState(exam?.classroom.id ?? classes[0]?.id ?? "");
  const editing = Boolean(exam);
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? exam?.template;
  const selectedClassroom =
    classes.find((classroom) => classroom.id === classId) ?? exam?.classroom;
  const canSave = Boolean(name.trim() && selectedTemplate && selectedClassroom);
  const save = () => {
    if (!selectedTemplate || !selectedClassroom) return;
    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: name.trim(),
      template: structuredClone(selectedTemplate),
      classroom: structuredClone(selectedClassroom),
      records: exam?.records ?? [],
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
      <main className="page new-answer-card-page">
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
          <label>
            答题卡
            <Select
              value={templateId}
              onChange={setTemplateId}
              options={templates.map((template) => ({ value: template.id, label: template.name }))}
              ariaLabel="答题卡"
            />
          </label>
          <label>
            参考班级
            <Select
              value={classId}
              onChange={setClassId}
              options={classes.map((classroom) => ({ value: classroom.id, label: classroom.name }))}
              ariaLabel="参考班级"
            />
          </label>
        </FormSection>
        <button className="create-template-button" disabled={!canSave} onClick={save}>
          <Check size={19} />
          {editing ? "保存考试" : "创建考试"}
        </button>
        {(!templates.length || !classes.length) && (
          <p className="real-note">请先创建答题卡，并在班级管理中创建班级。</p>
        )}
      </main>
    </>
  );
}
