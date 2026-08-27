import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input {...props} className={`app-input${props.className ? ` ${props.className}` : ""}`} />
  );
}
