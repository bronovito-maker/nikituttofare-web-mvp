'use client';

import { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem } from './ShoppingList';
import { getShoppingList, updateShoppingList } from '@/app/actions/technician-actions';
import { toast } from 'sonner';

interface ShoppingListContainerProps {
    ticketId: string;
    className?: string;
}

export function ShoppingListContainer({ ticketId, className }: ShoppingListContainerProps) {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadList() {
            try {
                const data = await getShoppingList(ticketId);
                setItems(data);
            } catch (error) {
                console.error('Error loading shopping list:', error);
            } finally {
                setLoading(false);
            }
        }
        loadList();
    }, [ticketId]);

    const handleToggleComplete = async (index: number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], completed: !newItems[index].completed };
        setItems(newItems);
        
        const result = await updateShoppingList(ticketId, newItems);
        if (!result.success) {
            toast.error('Errore aggiornamento lista');
            // Rollback local state if needed
        }
    };

    const handleRemove = async (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        
        const result = await updateShoppingList(ticketId, newItems);
        if (result.success) {
            toast.success('Articolo rimosso');
        } else {
            toast.error('Errore durante la rimozione');
        }
    };

    if (loading) return null;

    return (
        <ShoppingList 
            items={items} 
            onToggleComplete={handleToggleComplete} 
            onRemove={handleRemove}
            className={className}
        />
    );
}
