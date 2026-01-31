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
            <aside className="hidden md:flex w-64 flex-none bg-card border-r border-border z-50 flex-col">
                <SidebarNav />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Mobile Header Bar */}
                <div className="md:hidden flex items-center h-14 px-4 border-b bg-background w-full flex-none">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary -ml-2" suppressHydrationWarning>
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[80%] max-w-[300px] bg-card border-r border-border p-0 text-foreground">
                            <SheetTitle className="sr-only">Menu Navigazione</SheetTitle>
                            <div className="h-full w-full">
                                <SidebarNav expanded onLinkClick={() => setIsMobileOpen(false)} />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <span className="font-semibold ml-2">Admin Dashboard</span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
