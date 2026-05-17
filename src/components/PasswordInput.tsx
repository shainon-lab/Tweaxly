"use client";

// Password input with an inline eye toggle. Drop-in replacement for
// <input className="input" type="password" ... />.
//
// Accessibility:
//   - The toggle is a real <button type="button"> with aria-label.
//   - Pressing the toggle does not submit the surrounding form.
//   - Tab order: input → toggle → next field.

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${props.className ?? "input"} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-md transition"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
