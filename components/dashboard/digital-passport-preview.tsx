'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DigitalPassportPreview() {
    const assets = ['Caldaia Vaillant', 'Climatizzatore Daikin', 'Impianto Elettrico', 'Porta Blindata'];

    return (
        <section className="pt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Digital Passport</h2>
                <Button variant="link" className="text-blue-400 text-sm">Vedi tutti gli asset</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assets.map((item) => (
                    <div key={item} className="aspect-square rounded-2xl bg-[#151515] border border-white/5 p-4 flex flex-col justify-end hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">{item}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Ultimo check: 12/2024</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
