'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Since we checked package.json and @radix-ui/react-tooltip was MISSING,
// We will implement a simple CSS-only/State-based tooltip or auto-install it.
// Given constraints, let's implement a simple Tailwind-based Tooltip to ensure it works without npm install issues.
// ACTUALLY, sticking to the requested premium feel, I should simulate the Radix API so existing code works.

const Provider = ({ children, delayDuration }: { readonly children: React.ReactNode, readonly delayDuration?: number }) => <div className="contents">{children}</div>;

const Root = ({ children }: { readonly children: React.ReactNode }) => {
    return <div className="group relative w-fit h-fit">{children}</div>;
};

const Trigger = ({ asChild, children }: { readonly asChild?: boolean, readonly children: React.ReactNode }) => {
    return <div className="inline-block">{children}</div>;
};

const Content = ({ className, side = 'top', children }: { readonly className?: string, readonly side?: 'top' | 'right' | 'bottom' | 'left', readonly children: React.ReactNode }) => {
    const sideClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };

    return (
        <div
            className={cn(
                'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 invisible group-hover:visible',
                sideClasses[side],
                className
            )}
        >
            {children}
        </div>
    );
};

export const TooltipProvider = Provider;
export const Tooltip = Root;
export const TooltipTrigger = Trigger;
export const TooltipContent = Content;
