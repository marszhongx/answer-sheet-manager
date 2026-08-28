import { Plus, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import styles from "./EditableTable.module.css";

type Column<Row> = {
  key: keyof Row;
  label: string;
  render: (row: Row, onChange: (value: string) => void) => ReactNode;
};
type Props<Row extends { id: string }> = {
  columns: Column<Row>[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  createRow: () => Row;
  title?: ReactNode;
  actions?: ReactNode;
};

export default function EditableTable<Row extends { id: string }>({
  columns,
  rows,
  onChange,
  createRow,
  title,
  actions,
}: Props<Row>) {
  const update = (id: string, key: keyof Row, value: string) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  const addRow = () => onChange([...rows, createRow()]);

  return (
    <section className={styles.section}>
      {(title || actions) && (
        <div className={styles.toolbar}>
          <div className={styles.title}>{title}</div>
          <div className={styles.actions}>{actions}</div>
        </div>
      )}
      <div className={styles.table} role="table">
        <div className={styles.header} role="row">
          {columns.map((column) => (
            <span key={String(column.key)} role="columnheader">
              {column.label}
            </span>
          ))}
          <span aria-label="操作" />
        </div>
        {rows.map((row) => (
          <div className={styles.row} role="row" key={row.id}>
            {columns.map((column) => (
              <div role="cell" key={String(column.key)}>
                {column.render(row, (value) => update(row.id, column.key, value))}
              </div>
            ))}
            <button
              type="button"
              className={styles.remove}
              aria-label="删除行"
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <div className={styles.addRowCell}>
          <button type="button" className={styles.addRow} onClick={addRow}>
            <Plus size={17} />
            添加行
          </button>
        </div>
      </div>
    </section>
  );
}
