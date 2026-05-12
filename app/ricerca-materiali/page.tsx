"use client";

import React, { useState } from 'react';
import { Search, PackageSearch, Package, MapPin, AlertCircle, Sparkles, PlusCircle } from 'lucide-react';
import './ricerca.css';

interface ProductResult {
    name: string;
    price: string;
    url: string;
    stock: string;
    location: string;
    source: string;
}

interface AIInsights {
    advice: string;
    kit: string[];
}

export default function RicercaMateriali() {
    const [query, setQuery] = useState<string>('');
    const [negozio, setNegozio] = useState<string>('mix');
    const [sortPrice, setSortPrice] = useState<boolean>(false);
    
    const [results, setResults] = useState<ProductResult[]>([]);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    // Usa https:// per evitare problemi di mixed content e CORS
    const API_BASE_URL = 'https://tecnomatsearch-production.up.railway.app';

    const handleSearch = async (e?: React.FormEvent<HTMLFormElement>, overrideQuery?: string) => {
        if (e) e.preventDefault();
        
        const searchTerms = overrideQuery || query;
        if (!searchTerms.trim()) return;

        setIsLoading(true);
        setError('');
        setResults([]);
        setAiInsights(null);
        setHasSearched(true);

        try {
            const url = new URL(`${API_BASE_URL}/api/search`);
            url.searchParams.append('q', searchTerms.trim());
            url.searchParams.append('negozio', negozio);
            url.searchParams.append('n', '10');
            if (sortPrice) url.searchParams.append('sort_price', 'true');

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Errore di rete o server offline');
            }

            const data = await response.json();

            // Mostra consigli AI se presenti
            if (data.ai_insights) {
                setAiInsights(data.ai_insights);
            }

            if (data.results && data.results.length > 0) {
                setResults(data.results);
            } else {
                setError("Nessun prodotto trovato. Prova con termini diversi.");
            }
        } catch (err) {
            console.error("Errore durante la ricerca:", err);
            setError("Impossibile connettersi al server. Assicurati che l'API sia attiva.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKitItemClick = (item: string) => {
        setQuery(item);
        handleSearch(undefined, item);
    };

    return (
        <div className="ricerca-wrapper">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="app-container">
                <header className="search-header glass-panel">
                    <h1 className="gradient-text">Ricerca Prodotti Locali</h1>
                    <p className="subtitle">Disponibilità in tempo reale a Rimini e dintorni</p>
                    
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-bar">
                            <Search className="icon-search" />
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="Cosa ti serve oggi? (es. trapano, silicone...)" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                required 
                            />
                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                Cerca
                            </button>
                        </div>
                        
                        <div className="filters">
                            <div className="filter-group">
                                <label htmlFor="negozioSelect">Negozio:</label>
                                <select 
                                    id="negozioSelect" 
                                    className="custom-select"
                                    value={negozio}
                                    onChange={(e) => setNegozio(e.target.value)}
                                >
                                    <option value="mix">Tutti i Negozi</option>
                                    <option value="tecnomat">Solo Tecnomat</option>
                                    <option value="leroy">Solo Leroy Merlin</option>
                                </select>
                            </div>
                            
                            <div className="filter-toggle">
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        id="sortPrice" 
                                        checked={sortPrice}
                                        onChange={(e) => setSortPrice(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>Ordina per Prezzo</span>
                            </div>
                        </div>
                    </form>
                </header>

                <main className="results-container">
                    {isLoading && (
                        <div className="loader-wrapper">
                            <div className="spinner"></div>
                            <p>Ricerca in corso nei sistemi... <br/><small>Bypass firewall in atto 🚀</small></p>
                        </div>
                    )}

                    {!isLoading && aiInsights && (
                        <div className="ai-section">
                            <div className="ai-header">
                                <Sparkles size={20} />
                                Consigli di Nikituttofare
                            </div>
                            <div className="ai-advice">{aiInsights.advice}</div>
                            <div className="ai-kit-container">
                                {aiInsights.kit.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="kit-tag"
                                        onClick={() => handleKitItemClick(item)}
                                    >
                                        <PlusCircle size={16} />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="results-grid">
                            {results.map((prod, idx) => {
                                const isTecnomat = prod.source === 'TECNOMAT';
                                const badgeClass = isTecnomat ? 'badge tecnomat' : 'badge leroy';

                                return (
                                    <a key={idx} href={prod.url} target="_blank" rel="noreferrer" className="product-card">
                                        <div className={badgeClass}>{prod.source}</div>
                                        <h3 className="product-name">{prod.name}</h3>
                                        <div className="product-price">{prod.price}</div>
                                        
                                        <div className="product-meta">
                                            <div className="meta-item">
                                                <Package className="meta-icon" />
                                                <span>{prod.stock}</span>
                                            </div>
                                            {isTecnomat && (
                                                <div className="meta-item">
                                                    <MapPin className="meta-icon" />
                                                    <span>{prod.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && error && hasSearched && (
                        <div className="empty-state">
                            <AlertCircle className="icon-empty" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!isLoading && !hasSearched && (
                        <div className="empty-state">
                            <PackageSearch className="icon-empty" />
                            <p>Inserisci un prodotto per iniziare la ricerca.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
