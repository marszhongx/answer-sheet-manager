import { Page } from "./Page";

type Props = { templateCount: number; onPage: (page: Page) => void };
export default function ProfilePage({ templateCount, onPage }: Props) {
  return (
    <>
      <header className="page-top">
        <div>
          <h1>我的</h1>
          <p>所有数据仅保存在当前浏览器</p>
        </div>
      </header>
      <main className="page profile-page">
        <section className="profile-card">
          <span className="profile-avatar">教</span>
          <div>
            <h2>本地阅卷工作台</h2>
            <p>未连接云端账户</p>
          </div>
        </section>
        <section className="profile-stats">
          <button onClick={() => onPage("templates")}>
            <b>{templateCount}</b>
            <span>答题卡</span>
          </button>
          <button onClick={() => onPage("analysis")}>
            <b>本机</b>
            <span>成绩数据</span>
          </button>
          <button>
            <b>H5</b>
            <span>识别模式</span>
          </button>
        </section>
      </main>
    </>
  );
}
