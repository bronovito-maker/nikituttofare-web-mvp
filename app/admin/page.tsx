'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Settings, 
  Bell,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Zap,
  Key,
  Thermometer,
  ArrowUpRight,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types for admin dashboard
interface TicketData {
  id: string;
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
  status: 'new' | 'pending_verification' | 'confirmed' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  address: string | null;
  created_at: string;
  user_email?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
  plumbing: { icon: Wrench, color: 'text-blue-600 bg-blue-50', label: 'Idraulico' },
  electric: { icon: Zap, color: 'text-yellow-600 bg-yellow-50', label: 'Elettricista' },
  locksmith: { icon: Key, color: 'text-slate-600 bg-slate-100', label: 'Fabbro' },
  climate: { icon: Thermometer, color: 'text-cyan-600 bg-cyan-50', label: 'Clima' },
  generic: { icon: Wrench, color: 'text-purple-600 bg-purple-50', label: 'Generico' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: 'bg-blue-100 text-blue-700', label: 'Nuovo' },
  assigned: { color: 'bg-purple-100 text-purple-700', label: 'Assegnato' },
  in_progress: { color: 'bg-yellow-100 text-yellow-700', label: 'In Corso' },
  resolved: { color: 'bg-green-100 text-green-700', label: 'Risolto' },
  cancelled: { color: 'bg-slate-100 text-slate-500', label: 'Annullato' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  emergency: { color: 'bg-red-500 text-white', label: '🚨 Emergenza' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Media' },
  low: { color: 'bg-green-100 text-green-700', label: 'Bassa' },
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/tickets');
        if (!res.ok) {
          throw new Error('Impossibile caricare i ticket');
        }
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Stats calculation
  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    emergency: tickets.filter(t => t.priority === 'emergency').length,
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.description.toLowerCase().includes(query) ||
        ticket.address?.toLowerCase().includes(query) ||
        ticket.user_email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setTickets(prev => 
      prev.map(t => t.id === ticketId ? { ...t, status: newStatus as TicketData['status'] } : t)
    );
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Aggiornamento non riuscito');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di aggiornamento');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 hidden lg:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">NTF</span>
            </div>
            <div>
              <span className="text-lg font-black text-slate-900">Admin</span>
              <p className="text-xs text-slate-500">NikiTuttoFare</p>
            </div>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            href="/admin/tickets" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Ticket className="w-5 h-5" />
            Ticket
          </Link>
          <Link 
            href="/admin/technicians" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Users className="w-5 h-5" />
            Tecnici
          </Link>
          <Link 
            href="/admin/settings" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Impostazioni
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
              <p className="text-sm text-slate-500">Gestione ticket e interventi</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                {stats.new > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.new}
                  </span>
                )}
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Ticket Totali" 
              value={stats.total} 
              icon={<Ticket className="w-5 h-5" />}
              trend="+12% questo mese"
              color="blue"
            />
            <StatCard 
              title="Nuovi" 
              value={stats.new} 
              icon={<Clock className="w-5 h-5" />}
              trend="Da gestire"
              color="yellow"
            />
            <StatCard 
              title="In Corso" 
              value={stats.inProgress} 
              icon={<TrendingUp className="w-5 h-5" />}
              trend="Attivi ora"
              color="purple"
            />
            <StatCard 
              title="Emergenze" 
              value={stats.emergency} 
              icon={<AlertTriangle className="w-5 h-5" />}
              trend="Priorità massima"
              color="red"
            />
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Ticket Recenti</h2>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cerca ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Tutti</option>
                  <option value="new">Nuovi</option>
                  <option value="assigned">Assegnati</option>
                  <option value="in_progress">In Corso</option>
                  <option value="resolved">Risolti</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="px-6 py-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">Caricamento ticket...</div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priorità</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                    const categoryConfig = CATEGORY_CONFIG[ticket.category];
                    const CategoryIcon = categoryConfig.icon;
                    
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {ticket.description}
                            </p>
                            <p className="text-xs text-slate-500">{ticket.address || 'Indirizzo non specificato'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${categoryConfig.color}`}>
                            <CategoryIcon className="w-4 h-4" />
                            <span className="text-xs font-semibold">{categoryConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_CONFIG[ticket.priority].color}`}>
                            {PRIORITY_CONFIG[ticket.priority].label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_CONFIG[ticket.status].color}`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                              <option key={value} value={value}>{config.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(ticket.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ArrowUpRight className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTickets.length === 0 && (
              <div className="p-12 text-center">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nessun ticket trovato</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: string;
  color: 'blue' | 'yellow' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs text-slate-500">{trend}</span>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
    </div>
  );
}
