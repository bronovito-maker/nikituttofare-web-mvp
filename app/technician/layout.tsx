import { TechnicianNav } from '@/components/technician/technician-nav';

export default function TechnicianLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-background text-foreground pb-[env(safe-area-inset-bottom)]">
            <TechnicianNav />
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
