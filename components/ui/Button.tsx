"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark",
  secondary:
    "bg-transparent border-[1.5px] border-border text-ink hover:border-ink-mid",
  ghost:
    "bg-transparent text-ink-mid hover:text-ink hover:bg-off-white px-3 py-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-semibold text-base transition-all duration-160 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    const padding = variant === "ghost" ? "" : "px-6 py-3.5";

    return (
      <button
        ref={ref}
        className={`${base} ${padding} ${variantClasses[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
