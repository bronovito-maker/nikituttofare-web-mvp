import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const sizeClasses = {
      lg: "px-8 py-4 text-lg h-14",
      md: "px-5 py-2 text-base h-11",
      sm: "px-3 py-1.5 text-sm h-9",
      icon: "h-9 w-9 p-0",
    };

    const variantClasses = {
      default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
      ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      link: "text-blue-500 underline-offset-4 hover:underline",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
