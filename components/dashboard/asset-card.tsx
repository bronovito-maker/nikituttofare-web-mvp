'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';
import { deleteUserAsset } from '@/app/actions/assets-actions';
import { toast } from 'sonner';
import { useState } from 'react';

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
        <Card key={asset.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-2">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <CardTitle className="text-lg leading-tight">{asset.address}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm font-medium text-muted-foreground">{asset.city}</p>
                {asset.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded-md text-foreground/80 italic">
                        &quot;{asset.notes}&quot;
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
