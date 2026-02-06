"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function RetroGrid({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render grid until client-side to avoid hydration issues
  if (!isMounted) {
    return <div className={cn("pointer-events-none absolute h-full w-full", className)} />;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden opacity-50 [perspective:200px] hidden md:block",
        className,
      )}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(35deg)]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:60px_60px]",
            "[height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            // Light Styles
            "[background-image:linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_0)]",
            // Dark Styles
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_0)]",
          )}
        />
      </div>

      {/* Background Gradient per sfumare in alto */}
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90%" />
    </div>
  );
}
