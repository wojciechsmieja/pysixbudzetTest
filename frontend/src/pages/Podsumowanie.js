import React, { useEffect, useState, useCallback } from 'react';
import { data as api } from '../services/api';
import PodsumowanieTable from '../components/PodsumowanieTable';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import './Podsumowanie.css';

const Podsumowanie = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedIncomeBranch, setSelectedIncomeBranch] = useState(null);
    const [selectedExpenseBranch, setSelectedExpenseBranch] = useState(null);

    // Inline styles to force the changes, bypassing CSS file issues.
    const chartSelectStyle = {
        outline: '0px solid transparent', // More forceful way to remove outline
        boxShadow: 'none', // Remove any default shadow
        padding: '0.75rem 2.5rem 0.75rem 1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)', // --border-color
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        backgroundColor: '#191E2C', // --surface-1
        color: '#F9FAFB', // --text-primary
        width: '280px', // Fixed width
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '1em',
    };

    const fetchData = useCallback(async (currentYear) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getPodsumowanie({ year: currentYear });
            setData(response.data);
            if (response.data.all_income_branches && response.data.all_income_branches.length > 0) {
                setSelectedIncomeBranch(response.data.all_income_branches[0]);
            }
            if (response.data.all_expense_branches && response.data.all_expense_branches.length > 0) {
                setSelectedExpenseBranch(response.data.all_expense_branches[0]);
            }
        } catch (err) {
            setError(`Nie udało się pobrać danych: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(year);
    }, [year, fetchData]);

    const months_order = data ? data.months_order : [];

    const incomeLineChartData = selectedIncomeBranch && data?.income_chart_data?.line_charts[selectedIncomeBranch];
    const expenseLineChartData = selectedExpenseBranch && data?.expense_chart_data?.line_charts[selectedExpenseBranch];

    return (
        <div className="page-wrapper" id="website-top">
            <header className="page-header">
                <h1>Podsumowanie budżetu</h1>
            </header>

            <div className="filter-bar filter-bar-center">
                 <div className="filter-group">
                    <span className="filter-label">Rok:</span>
                    <div className="filter-chips">
                        <button className="chip" onClick={() => setYear(y => y - 1)} disabled={loading || !data || data.min_year >= year}>‹ {year - 1}</button>
                        <button className="chip active">{year}</button>
                        <button className="chip" onClick={() => setYear(y => y + 1)} disabled={loading || !data || data.max_year <= year}>{year + 1} ›</button>
                    </div>
                </div>
            </div>

            {loading && <p className="loading-text">Ładowanie danych...</p>}
            {error && <p className="error-text">{error}</p>}

            <div className='scroll-to-charts'>
                <button className='chip' onClick={() => document.getElementById("charts-scroll")?.scrollIntoView({behavior:'smooth'})}>Zjedź do wykresów</button>    
            </div>

            {data && !loading && !error && (
                <main className="content-area">
                    <PodsumowanieTable data={data.income_table} title="Przychody" />
                    <PodsumowanieTable data={data.expense_table} title="Wydatki" />

                    <hr className="section-divider" />

                    <h2 className="section-title" id="charts-scroll">Wykresy</h2>

                    <div className="charts-section" >
                        <h3 className="subsection-title">Przychody</h3>
                        <div className="chart-filter-bar">
                            <label htmlFor="income-branch-select">Filtruj po gałęzi:</label>
                            <select 
                                id="income-branch-select"
                                style={chartSelectStyle}
                                onChange={(e) => setSelectedIncomeBranch(e.target.value)}
                                value={selectedIncomeBranch || ''}
                                disabled={loading || !data.all_income_branches || data.all_income_branches.length === 0}
                            >
                                {data.all_income_branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                        <div className="chart-grid">
                            {incomeLineChartData && (
                                <div className="chart-wrapper">
                                    <LineChart 
                                        title={`Miesięczne Przychody dla: ${selectedIncomeBranch}`}
                                        labels={months_order}
                                        currentYearData={incomeLineChartData.current_year}
                                        prevYearData={incomeLineChartData.prev_year}
                                    />
                                </div>
                            )}
                            {data.income_chart_data && data.income_chart_data.bar_chart && (
                                <div className="chart-wrapper">
                                    <BarChart 
                                        title="Suma Przychodów dla Gałęzi (Bieżący Rok)"
                                        labels={Object.keys(data.income_chart_data.bar_chart)}
                                        data={Object.values(data.income_chart_data.bar_chart)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="charts-section">
                        <h3 className="subsection-title">Wydatki</h3>
                        <div className="chart-filter-bar">
                            <label htmlFor="expense-branch-select">Filtruj po gałęzi:</label>
                            <select 
                                id="expense-branch-select"
                                style={chartSelectStyle}
                                onChange={(e) => setSelectedExpenseBranch(e.target.value)}
                                value={selectedExpenseBranch || ''}
                                disabled={loading || !data.all_expense_branches || data.all_expense_branches.length === 0}
                            >
                                {data.all_expense_branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                        <div className="chart-grid">
                            {expenseLineChartData && (
                                <div className="chart-wrapper">
                                    <LineChart 
                                        title={`Miesięczne Wydatki dla: ${selectedExpenseBranch}`}
                                        labels={months_order}
                                        currentYearData={expenseLineChartData.current_year}
                                        prevYearData={expenseLineChartData.prev_year}
                                    />
                                </div>
                            )}
                            {data.expense_chart_data && data.expense_chart_data.bar_chart && (
                                <div className="chart-wrapper">
                                    <BarChart 
                                        title="Suma Wydatków dla Gałęzi (Bieżący Rok)"
                                        labels={Object.keys(data.expense_chart_data.bar_chart)}
                                        data={Object.values(data.expense_chart_data.bar_chart)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='scroll-up'><button className='chip' onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Powróć na górę</button></div>
                </main>
            )}
        </div>
    );
};

export default Podsumowanie;
