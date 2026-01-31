'use client';

import { useState } from 'react';
import { updateLeadStatus, updateLeadNotes } from '@/app/actions/leads-actions';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin } from 'lucide-react';
// import { updateLeadNotes } from '@/app/actions/leads-actions'; // Removed duplicate

interface LeadsTableProps {
    leads: any[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
    const [search, setSearch] = useState('');
    const [filterCity, setFilterCity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Extract unique cities
    const cities = Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort();

    const filteredLeads = leads.filter(lead => {
        const s = search.toLowerCase();
        const cityMatch = filterCity === 'all' || lead.city === filterCity;
        const statusMatch = filterStatus === 'all' ||
            (filterStatus === 'mail_sent' && lead.status_mail_sent) ||
            (filterStatus === 'confirmed' && lead.status_confirmed) ||
            (filterStatus === 'visited' && lead.status_visited) ||
            (filterStatus === 'to_contact' && !lead.status_mail_sent && !lead.status_called);

        const textMatch = lead.name.toLowerCase().includes(s) ||
            lead.address?.toLowerCase().includes(s) ||
            lead.type?.toLowerCase().includes(s);

        return cityMatch && statusMatch && textMatch;
    });

    const handleStatusChange = async (id: string, field: string, value: boolean) => {
        try {
            // Optimistic update could be done here, but let's wait for revalidate for consistency
            await updateLeadStatus(id, field, value);
            toast.success('Stato aggiornato');
        } catch (e) {
            toast.error('Errore aggiornamento');
        }
    };

    const handleNoteBlur = async (id: string, currentNote: string, newNote: string) => {
        if (currentNote === newNote) return;
        try {
            await updateLeadNotes(id, newNote);
            toast.success('Nota salvata');
        } catch (e) {
            toast.error('Errore salvataggio nota');
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Cerca struttura..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Città" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutte le città</SelectItem>
                        {cities.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="to_contact">🔴 Da Contattare</SelectItem>
                        <SelectItem value="mail_sent">✉️ Mail Inviata</SelectItem>
                        <SelectItem value="visited">👣 Visitato</SelectItem>
                        <SelectItem value="confirmed">✅ Confermato</SelectItem>
                    </SelectContent>
                </Select>

                <div className="ml-auto text-sm text-muted-foreground content-center">
                    {filteredLeads.length} risultati
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Struttura</TableHead>
                            <TableHead>Contatti</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="w-[300px]">Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.map((lead) => (
                            <TableRow key={lead.id}>
                                <TableCell>
                                    <div className="font-medium text-lg">{lead.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        {lead.city} • <Badge variant="outline" className="text-xs">{lead.type}</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={lead.address}>
                                        <MapPin className="w-3 h-3 inline mr-1" />{lead.address}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        {lead.phone && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Phone className="w-3 h-3" /> <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                                            </div>
                                        )}
                                        {lead.email && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Mail className="w-3 h-3" /> <a href={`mailto:${lead.email}`} className="hover:underline truncate max-w-[150px]">{lead.email}</a>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="grid grid-cols-2 gap-2 min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={lead.status_mail_sent}
                                                onCheckedChange={(v) => handleStatusChange(lead.id, 'status_mail_sent', v)}
                                            />
                                            <span className="text-xs">Mail</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={lead.status_called}
                                                onCheckedChange={(v) => handleStatusChange(lead.id, 'status_called', v)}
                                            />
                                            <span className="text-xs">Tel</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={lead.status_visited}
                                                onCheckedChange={(v) => handleStatusChange(lead.id, 'status_visited', v)}
                                            />
                                            <span className="text-xs">Visit</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={lead.status_confirmed}
                                                onCheckedChange={(v) => handleStatusChange(lead.id, 'status_confirmed', v)}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                            <span className="text-xs font-bold">OK</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Textarea
                                        defaultValue={lead.notes || ''}
                                        onBlur={(e) => handleNoteBlur(lead.id, lead.notes, e.target.value)}
                                        className="min-h-[80px] text-sm resize-none bg-muted/20"
                                        placeholder="Aggiungi note..."
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
