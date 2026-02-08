import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground p-6 shadow", className)}>{children}</div>;
}

export function CardHeader({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <h3 className={cn("text-lg font-bold", className)}>{children}</h3>;
}

export function CardContent({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardDescription({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardFooter({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>;
}
