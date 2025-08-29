import React, { useEffect, useState, useCallback } from 'react';
import { data as api } from '../services/api';
import WynagrodzeniaTable from '../components/WynagrodzeniaTable';
import './Wynagrodzenia.css';

const Wynagrodzenia = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [sortConfig, setSortConfig] = useState({ key: 'Suma roczna', direction: 'desc' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                year: year,
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction
            };
            const response = await api.getWynagrodzenia(params);
            setData(response.data);
        } catch (err) {
            setError(`Nie udało się pobrać danych: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [year, sortConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="page-wrapper">
            <header className="page-header">
                <h1>Podział wynagrodzeń</h1>
            </header>

            <div className="filter-bar filter-bar-center">
                <div className="filter-group">
                    <span className="filter-label">Rok:</span>
                    <div className="filter-chips">
                        <button className="chip" onClick={() => setYear(y => y - 1)} disabled={loading || (data && data.min_year >= year)}>‹ {year - 1}</button>
                        <button className="chip active">{year}</button>
                        <button className="chip" onClick={() => setYear(y => y + 1)} disabled={loading || (data && data.max_year <= year)}>{year + 1} ›</button>
                    </div>
                </div>
            </div>

            {loading && <p className="loading-text">Ładowanie danych...</p>}
            {error && <p className="error-text">{error}</p>}

            {data && !loading && !error && (
                <main className="content-area" style={{ opacity: loading ? 0.6 : 1 }}>

                        <WynagrodzeniaTable 
                            data={data.table_data} 
                            monthsOrder={data.months_order}
                            requestSort={handleSort}
                            sortConfig={sortConfig} 
                        />


                </main>
            )}
            <div className='scroll-up'><button className='chip' onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Powróć na górę</button></div>
        </div>
    );
};

export default Wynagrodzenia;
