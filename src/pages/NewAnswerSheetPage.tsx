import { useMemo, useState } from "react";
import FormSection from "../components/FormSection";
import Input from "../components/Input";
import NumberInput from "../components/NumberInput";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import SubmitButton from "../components/SubmitButton";
import { Check, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AnswerSheet,
  createQuestions,
  defaultSections,
  fitsA4,
  OPTION_LABELS,
  Option,
  QuestionSection,
  answerSheetSections,
} from "../lib/omr";
import { useAppStore } from "../store/appStore";
import styles from "./NewAnswerSheetPage.module.css";

const makeSection = (index: number): QuestionSection => ({
  id: crypto.randomUUID(),
  name: `第${index + 1}大题`,
  pointsPerQuestion: 5,
  optionCount: 4,
  questions: createQuestions(5),
});

export default function NewAnswerSheetPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const answerSheetMap = useAppStore((state) => state.answerSheetMap);
  const examMap = useAppStore((state) => state.examMap);
  const answerSheet =
    answerSheetMap[id ?? ""] ?? answerSheetMap[examMap[id ?? ""]?.answerSheetId ?? ""];
  const [name, setName] = useState(answerSheet?.name ?? "");
  const [subject, setSubject] = useState(answerSheet?.subject ?? "数学");
  const [candidateNumberLength, setCandidateNumberLength] = useState(
    answerSheet?.candidateNumberLength ?? 2,
  );
  const [sections, setSections] = useState(() =>
    answerSheet ? answerSheetSections(answerSheet) : defaultSections(),
  );
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(answerSheet);
  const totals = useMemo(
    () => ({
      questions: sections.reduce((sum, section) => sum + section.questions.length, 0),
      score: sections.reduce(
        (sum, section) => sum + section.questions.length * section.pointsPerQuestion,
        0,
      ),
    }),
    [sections],
  );
  const updateSection = (
    sectionId: string,
    key: "name" | "pointsPerQuestion" | "optionCount",
    value: string | number,
  ) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, [key]: value } : section,
      ),
    );
  const setQuestionCount = (sectionId: string, count: number) =>
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const existing = section.questions;
        const questions =
          count < existing.length
            ? existing.slice(0, count)
            : [...existing, ...createQuestions(count - existing.length)];
        return { ...section, questions };
      }),
    );
  const addQuestion = (sectionId: string) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, ...createQuestions(1)] }
          : section,
      ),
    );
  const removeQuestion = (sectionId: string, questionId: string) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId && section.questions.length > 1
          ? { ...section, questions: section.questions.filter((q) => q.id !== questionId) }
          : section,
      ),
    );
  const setAnswer = (sectionId: string, questionId: string, answer: Option) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId ? { ...question, answer } : question,
              ),
            }
          : section,
      ),
    );
  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName || !totals.questions) return;
    const candidate: AnswerSheet = {
      id: answerSheet?.id ?? crypto.randomUUID(),
      name: cleanName,
      subject,
      candidateNumberLength,
      sections,
      createdAt: answerSheet?.createdAt ?? new Date().toISOString(),
      isTemplate: answerSheet?.isTemplate ?? true,
    };
    if (!fitsA4(candidate)) {
      setError("题目过多，答题卡将超出 A4 纸张范围，请减少题目数量或选项数量");
      return;
    }
    const store = useAppStore.getState();
    const examId = pathname.startsWith("/exams/") ? id : undefined;
    if (examId) {
      await store.updateAnswerSheet(candidate);
      store.notify("考试答题卡已保存");
      navigate(`/exams/${examId}`);
      return;
    }
    if (store.answerSheetMap[candidate.id]) {
      await store.updateAnswerSheet(candidate);
    } else {
      await store.createAnswerSheet(candidate);
    }
    store.notify("答题卡已保存");
    navigate(`/answer-sheets/${candidate.id}`);
  };
  return (
    <>
      <PageHeader
        title={editing ? "编辑答题卡" : "新建答题卡"}
        onBack={() => navigate(pathname.startsWith("/exams/") ? `/exams/${id}` : "/answer-sheets")}
        backLabel="返回"
      />
      <main className={`page ${styles.editor}`}>
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
          <div className={styles.sectionHead}>
            <h2>题目结构</h2>
            <span>
              {totals.questions} 题 / {totals.score} 分
            </span>
          </div>
          {sections.map((section, index) => (
            <div className={styles.questionSection} key={section.id}>
              <div className={styles.questionSectionHeader}>
                <Input
                  aria-label={`第${index + 1}大题名称`}
                  className={styles.sectionNameInput}
                  value={section.name}
                  onChange={(event) => updateSection(section.id, "name", event.target.value)}
                />
                <button
                  className={styles.iconDanger}
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
                  value={section.questions.length}
                  min={1}
                  max={60}
                  compact
                  onChange={(value) => setQuestionCount(section.id, value)}
                />
              </label>
              <label>
                每题分值
                <NumberInput
                  value={section.pointsPerQuestion}
                  min={1}
                  max={100}
                  compact
                  onChange={(value) => updateSection(section.id, "pointsPerQuestion", value)}
                />
              </label>
              <label>
                选项数量
                <NumberInput
                  value={section.optionCount}
                  min={2}
                  max={10}
                  compact
                  onChange={(value) => updateSection(section.id, "optionCount", value)}
                />
              </label>
              <div className={styles.answersEditor}>
                <span className={styles.answersLabel}>题目答案</span>
                {section.questions.map((question, questionIndex) => (
                  <div className={styles.answerRow} key={question.id}>
                    <b>{questionIndex + 1}</b>
                    {OPTION_LABELS.slice(0, section.optionCount).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={question.answer === option ? styles.selected : ""}
                        onClick={() => setAnswer(section.id, question.id, option)}
                      >
                        {option}
                      </button>
                    ))}
                    <button
                      className={styles.iconDanger}
                      aria-label={`删除第${questionIndex + 1}题`}
                      disabled={section.questions.length === 1}
                      onClick={() => removeQuestion(section.id, question.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  className={styles.addQuestion}
                  onClick={() => {
                    setError(null);
                    addQuestion(section.id);
                  }}
                >
                  <Plus size={16} />
                  添加题目
                </button>
              </div>
            </div>
          ))}
          <button
            className={styles.addSection}
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
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <SubmitButton icon={<Check size={19} />} disabled={!name.trim() || !totals.questions} onClick={save}>
          {editing ? "保存答题卡" : "创建答题卡"}
        </SubmitButton>
      </main>
    </>
  );
}
