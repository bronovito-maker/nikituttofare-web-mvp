'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DigitalPassportPreview() {
    const assets = ['Caldaia Vaillant', 'Climatizzatore Daikin', 'Impianto Elettrico', 'Porta Blindata'];

    return (
        <section className="pt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Digital Passport</h2>
                <Button variant="link" className="text-blue-500 dark:text-blue-400 text-sm">Vedi tutti gli asset</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assets.map((item) => (
                    <div key={item} className="aspect-square rounded-2xl bg-card border border-border p-4 flex flex-col justify-end hover:bg-secondary/50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{item}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Ultimo check: 12/2024</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
