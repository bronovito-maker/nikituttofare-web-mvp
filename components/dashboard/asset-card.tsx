'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';
import { deleteUserAsset } from '@/app/actions/assets-actions';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';

interface AssetProps {
    asset: {
        id: string;
        address: string;
        city: string;
        notes: string | null;
    };
}

export function AssetCard({ asset }: Readonly<AssetProps>) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Sei sicuro di voler eliminare questo indirizzo?')) return;

        setIsDeleting(true);
        const result = await deleteUserAsset(asset.id);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
            setIsDeleting(false);
        }
    };

    return (
        <Link href={`/dashboard/assets/${asset.id}`}>
            <Card key={asset.id} className="relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border-white/10 bg-[#151515] hover:border-white/20">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 group-hover:bg-blue-500/20 transition-colors">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <CardTitle className="text-lg leading-tight text-white group-hover:text-blue-400 transition-colors">{asset.address}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-slate-400">{asset.city}</p>
                    {asset.notes && (
                        <p className="text-sm mt-3 p-3 bg-black/20 rounded-lg text-slate-400 italic border border-white/5">
                            &quot;{asset.notes}&quot;
                        </p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="link" className="p-0 h-auto text-xs text-emerald-500">
                            Visualizza Passaporto Digitale &rarr;
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
