import React, { useState, useMemo } from 'react';
import './WynagrodzeniaTable.css';

const WynagrodzeniaTable = ({ data, monthsOrder, requestSort, sortConfig }) => {
    const [hoveredColumn, setHoveredColumn] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');

    const filteredPerson = useMemo(()=>{
        if(!data) return [];
        if(!globalFilter) return data;
        const filteredValue = globalFilter.toLowerCase();
        return data.filter(row=>{
            return row.Osoba && row.Osoba.toLowerCase().includes(filteredValue);
            }
        );
    }, [data, globalFilter]);
    if (!data || data.length === 0) {
        return <p className="loading-text">Brak danych do wyświetlenia.</p>;
    }

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const getSortIndicator = (key) => {
        if (sortConfig && sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? <span className="sort-indicator">▲</span> : <span className="sort-indicator">▼</span>;
        }
        return <span className="sort-indicator-placeholder"></span>;
    };

    const handleMouseEnter = (colIndex) => {
        setHoveredColumn(colIndex);
    };

    const handleMouseLeave = () => {
        setHoveredColumn(null);
    };

    return (
        <div>
        <div className="table-toolbar">
                <input
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="search-input"
                    placeholder="Wyszukaj kontrahenta..."
                />
        </div>
        <div className="wynagrodzenia-table-wrapper" >

            <table className="wynagrodzenia-table">
                <thead>
                    <tr>
                        <th 
                            className={`wyn-th ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                            onClick={() => requestSort('Osoba')}
                            onMouseEnter={() => handleMouseEnter(0)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="th-content">Osoba{getSortIndicator('Osoba')}</div>
                        </th>
                        {monthsOrder.map((month, index) => (
                            <th 
                                key={month} 
                                className={`wyn-th text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                onClick={() => requestSort(month)}
                                onMouseEnter={() => handleMouseEnter(index + 1)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="th-content">{month}{getSortIndicator(month)}</div>
                            </th>
                        ))}
                        <th 
                            className={`wyn-th text-right ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                            onClick={() => requestSort('Suma roczna')}
                            onMouseEnter={() => handleMouseEnter(13)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="th-content">Suma roczna{getSortIndicator('Suma roczna')}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPerson.length>0 ? (
                        filteredPerson.map((row, index) => (
                        <tr key={index}>
                            <td 
                                data-label="Osoba"
                                className={`wyn-td td-osoba ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(0)}
                                onMouseLeave={handleMouseLeave}
                            >{row.Osoba}</td>
                            {monthsOrder.map((month, i) => (
                                <td 
                                    data-label={month}
                                    key={month} 
                                    className={`wyn-td text-right ${hoveredColumn === i + 1 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(i + 1)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {formatNumber(row[month])}
                                </td>
                            ))}
                            <td 
                                data-label="Suma roczna"
                                className={`wyn-td text-right td-total ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(13)}
                                onMouseLeave={handleMouseLeave}
                            >{formatNumber(row['Suma roczna'])}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={monthsOrder.length+2} className="wyn-td text-center">
                            Brak wyników wyszukiwania.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

        </div>
        </div>
    );
};

export default WynagrodzeniaTable;
