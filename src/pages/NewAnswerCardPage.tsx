import { useMemo, useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import NumberInput from "../components/NumberInput";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { Check, Plus, Trash2 } from "lucide-react";
import {
  AnswerCardTemplate,
  createAnswers,
  defaultSections,
  fitsA4,
  QuestionSection,
  templateSections,
} from "../lib/omr";

type Props = {
  template?: AnswerCardTemplate;
  onSave: (template: AnswerCardTemplate) => void;
  onBack: () => void;
};
const makeSection = (index: number): QuestionSection => ({
  id: crypto.randomUUID(),
  name: `第${index + 1}大题`,
  questionCount: 5,
  pointsPerQuestion: 5,
  optionCount: 4,
});

export default function NewAnswerCardPage({ template, onSave, onBack }: Props) {
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "数学");
  const [candidateNumberLength, setCandidateNumberLength] = useState(
    template?.candidateNumberLength ?? 2,
  );
  const [sections, setSections] = useState(() =>
    template ? templateSections(template) : defaultSections(),
  );
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(template);
  const totals = useMemo(
    () => ({
      questions: sections.reduce((sum, section) => sum + section.questionCount, 0),
      score: sections.reduce(
        (sum, section) => sum + section.questionCount * section.pointsPerQuestion,
        0,
      ),
    }),
    [sections],
  );
  const update = (id: string, key: keyof QuestionSection, value: string | number) =>
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, [key]: value } : section)),
    );
  const save = () => {
    const cleanName = name.trim();
    if (!cleanName || !totals.questions) return;
    const answers = template?.answers ?? createAnswers(totals.questions);
    const candidate: AnswerCardTemplate = {
      id: template?.id ?? crypto.randomUUID(),
      name: cleanName,
      subject,
      candidateNumberLength,
      questionCount: totals.questions,
      sections,
      answers: [
        ...answers.slice(0, totals.questions),
        ...createAnswers(Math.max(0, totals.questions - answers.length)),
      ],
      createdAt: template?.createdAt ?? new Date().toISOString(),
    };
    if (!fitsA4(candidate)) {
      setError("题目过多，答题卡将超出 A4 纸张范围，请减少题目数量或选项数量");
      return;
    }
    onSave(candidate);
  };
  return (
    <>
      <PageHeader
        title={editing ? "编辑答题卡" : "新建答题卡"}
        onBack={onBack}
        backLabel="返回答题卡列表"
      />
      <main className="page answer-card-editor">
        <FormSection>
          <label>
            答题卡名称
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：第一单元测验"
              autoFocus
            />
          </label>
          <label>
            试卷科目
            <Select
              value={subject}
              onChange={setSubject}
              options={["数学", "语文", "英语", "物理", "化学"].map((value) => ({
                value,
                label: value,
              }))}
              ariaLabel="试卷科目"
            />
          </label>
          <label>
            准考证号位数
            <NumberInput
              value={candidateNumberLength}
              min={1}
              max={6}
              fullWidth
              onChange={setCandidateNumberLength}
            />
          </label>
        </FormSection>
        <section className="sections-editor">
          <div className="section-head">
            <h2>题目结构</h2>
            <span>
              {totals.questions} 题 / {totals.score} 分
            </span>
          </div>
          {sections.map((section, index) => (
            <div className="question-section" key={section.id}>
              <div>
                <Input
                  aria-label={`第${index + 1}大题名称`}
                  className="section-name-input"
                  value={section.name}
                  onChange={(event) => update(section.id, "name", event.target.value)}
                />
                <button
                  className="icon-danger"
                  aria-label={`删除${section.name}`}
                  disabled={sections.length === 1}
                  onClick={() =>
                    setSections((current) => current.filter((item) => item.id !== section.id))
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <label>
                小题数量
                <NumberInput
                  value={section.questionCount}
                  min={1}
                  max={60}
                  compact
                  onChange={(value) => update(section.id, "questionCount", value)}
                />
              </label>
              <label>
                每题分值
                <NumberInput
                  value={section.pointsPerQuestion}
                  min={1}
                  max={100}
                  compact
                  onChange={(value) => update(section.id, "pointsPerQuestion", value)}
                />
              </label>
              <label>
                选项数量
                <NumberInput
                  value={section.optionCount}
                  min={2}
                  max={10}
                  compact
                  onChange={(value) => update(section.id, "optionCount", value)}
                />
              </label>
            </div>
          ))}
          <button
            className="add-section"
            onClick={() => {
              setError(null);
              setSections((current) => [...current, makeSection(current.length)]);
            }}
          >
            <Plus size={18} />
            添加大题
          </button>
        </section>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="create-template-button"
          disabled={!name.trim() || !totals.questions}
          onClick={save}
        >
          <Check size={19} />
          {editing ? "保存答题卡" : "创建答题卡"}
        </button>
      </main>
    </>
  );
}
