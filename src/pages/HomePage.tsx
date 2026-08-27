import { Camera, ChevronRight, ClipboardCheck, LayoutTemplate, Plus, ScanLine } from "lucide-react";
import EmptyState from "./EmptyState";
import { Page } from "./Page";
import { AnswerCardTemplate } from "../lib/omr";

type Props = {
  templates: AnswerCardTemplate[];
  onPage: (page: Page) => void;
  onCreate: () => void;
};

export default function HomePage({ templates, onPage, onCreate }: Props) {
  return (
    <>
      <header className="app-header">
        <div className="logo">
          <span>
            <ClipboardCheck size={20} />
          </span>
          <b>Answer Sheet Manager</b>
        </div>
      </header>
      <main className="page home-page">
        <div className="welcome">
          <div>
            <p>答题卡阅卷</p>
            <h1>从一张标准答题卡开始</h1>
          </div>
        </div>
        {templates.length ? (
          <>
            <section className="continue-card">
              <div className="continue-info">
                <div className="continue-kicker">
                  <ScanLine size={14} />
                  准备就绪
                </div>
                <h2>{templates[0].name}</h2>
                <p>
                  {templates[0].subject} · {templates[0].questionCount} 道单选题
                </p>
                <span>标准答案已设置，可直接扫描阅卷</span>
              </div>
              <button aria-label="开始扫描" onClick={() => onPage("scan")} className="round-arrow">
                <ChevronRight size={22} />
              </button>
            </section>
            <section className="quick-section">
              <div className="section-head">
                <h2>快捷操作</h2>
              </div>
              <div className="quick-actions">
                <button onClick={() => onPage("scan")}>
                  <span className="quick-icon camera">
                    <Camera size={23} />
                  </span>
                  <b>扫描答卷</b>
                  <small>实时识别</small>
                </button>
                <button onClick={onCreate}>
                  <span className="quick-icon template">
                    <Plus size={24} />
                  </span>
                  <b>新建答题卡</b>
                  <small>设置答案</small>
                </button>
                <button onClick={() => onPage("templates")}>
                  <span className="quick-icon report">
                    <LayoutTemplate size={23} />
                  </span>
                  <b>管理模板</b>
                  <small>{templates.length} 张答题卡</small>
                </button>
              </div>
            </section>
          </>
        ) : (
          <EmptyState onCreate={onCreate} />
        )}
      </main>
    </>
  );
}
