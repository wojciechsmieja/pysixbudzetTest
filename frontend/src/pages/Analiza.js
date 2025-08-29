import React, { useEffect, useState, useCallback } from 'react';
import { data as api } from '../services/api';
import AnalizaTable from '../components/AnalizaTable';
import './Analiza.css';

const Analiza = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dataType, setDataType] = useState('Przychody');
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'Suma roczna', direction: 'desc' });

    const fetchData = useCallback(async (params) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getAnaliza(params);
            setData(response.data);
            if (!params.branch && response.data.branches && response.data.branches.length > 0) {
                setSelectedBranch(response.data.branches[0]);
            }
        } catch (err) {
            setError(`Nie udało się pobrać danych: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            const params = {
                typ: dataType,
                year: year,
                branch: selectedBranch,
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction
            };
            fetchData(params);
        }
    }, [dataType, year, selectedBranch, sortConfig, fetchData]);

    useEffect(() => {
        const params = { typ: dataType, year: year };
        fetchData(params);
    }, [dataType, year, fetchData]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDataTypeChange = (type) => {
        setDataType(type);
        setSelectedBranch(null);
        setData(null);
    };

    return (
        <div className="page-wrapper" id ="website-top">
            <header className="page-header" >
                <h1>Analiza budżetu</h1>
            </header>

            <div className="filter-bar">
                <div className="filter-group">
                    <span className="filter-label">Rok:</span>
                    <div className="filter-chips">
                        <button className="chip" onClick={() => setYear(y => y - 1)} disabled={loading || !data || data.min_year >= year}>‹ {year - 1}</button>
                        <button className="chip active">{year}</button>
                        <button className="chip" onClick={() => setYear(y => y + 1)} disabled={loading || !data || data.max_year <= year}>{year + 1} ›</button>
                    </div>
                </div>
                <div className="filter-group">
                    <span className="filter-label">Typ danych:</span>
                    <div className="filter-chips">
                        <button 
                            className={`chip ${dataType === 'Przychody' ? 'active' : ''}`}
                            onClick={() => handleDataTypeChange('Przychody')} 
                            disabled={loading}>
                            Przychody
                        </button>
                        <button 
                            className={`chip ${dataType === 'Wydatki' ? 'active' : ''}`}
                            onClick={() => handleDataTypeChange('Wydatki')} 
                            disabled={loading}>
                            Wydatki
                        </button>
                    </div>
                </div>
                {data && data.branches && (
                    <div className="filter-group">
                        <span className="filter-label">Gałąź:</span>
                        <div className="filter-chips filter-chips-analysis">
                            {data.branches.map(branch => (
                                <button 
                                    key={branch}
                                    className={`chip ${selectedBranch === branch ? 'active' : ''}`}
                                    onClick={() => setSelectedBranch(branch)}
                                    disabled={loading}>
                                    {branch}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="error-text">{error}</p>}
            <main className="content-area" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading && <div className="loading-overlay">Ładowanie...</div>}
                {data && selectedBranch ? (
                    <div>
                        <h2 className="table-title">Zestawienie dla gałęzi: {selectedBranch}</h2>
                        <AnalizaTable data={data} requestSort={handleSort} sortConfig={sortConfig} />
                    </div>
                ) : (
                    !loading && <p className="loading-text">Wybierz gałąź, aby zobaczyć dane.</p>
                )}
            </main>
            <div className='scroll-up'><button className='chip' onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Powróć na górę</button></div>
        </div>
    );
};

export default Analiza;