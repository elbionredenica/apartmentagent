"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border-[1.5px] border-border rounded-md px-4 py-3.5 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink focus:shadow-sm transition-all duration-160 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
