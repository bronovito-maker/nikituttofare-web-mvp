'use client';

import { useState } from 'react';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export function AdminLayoutShell({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-16 flex-none bg-card border-r border-border z-50 flex-col">
                <SidebarNav />
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <div className="md:hidden absolute top-4 left-4 z-[60]">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] max-w-[300px] bg-card border-r border-border p-0 text-foreground">
                        <SheetTitle className="sr-only">Menu Navigazione</SheetTitle>
                        <div className="h-full w-full">
                            <SidebarNav expanded />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {children}
            </main>
        </div>
    );
}
