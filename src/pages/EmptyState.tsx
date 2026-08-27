import { LayoutTemplate, Plus } from "lucide-react";

type Props = { onCreate: () => void };

export default function EmptyState({ onCreate }: Props) {
  return (
    <section className="empty-state">
      <LayoutTemplate size={37} />
      <h2>还没有答题卡</h2>
      <p>先创建一张标准答题卡，设置答案后即可打印并开始扫描阅卷。</p>
      <button onClick={onCreate}>
        <Plus size={18} />
        新建答题卡
      </button>
    </section>
  );
}
