import { ChangeEvent, InputHTMLAttributes, ReactNode, useRef } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  children: ReactNode;
  onFile: (file: File) => void;
};

export default function FileUploader({ children, onFile, className, ...props }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  };

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </button>
      <input
        {...props}
        ref={inputRef}
        type="file"
        accept={props.accept ?? "image/*"}
        onChange={handleChange}
        hidden
      />
    </>
  );
}
