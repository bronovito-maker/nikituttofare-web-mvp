import { TechnicianNav } from '@/components/technician/technician-nav';

export default function TechnicianLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <TechnicianNav />
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
