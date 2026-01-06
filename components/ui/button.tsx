import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses =
      size === "lg"
        ? "px-8 py-4 text-lg"
        : size === "sm"
        ? "px-3 py-1 text-sm"
        : "px-5 py-2 text-base";
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          sizeClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
