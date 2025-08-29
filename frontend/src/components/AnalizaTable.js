import React, { useState } from 'react';
import './AnalizaTable.css';

const AnalizaTable = ({ data, requestSort, sortConfig }) => {
    const [hoveredColumn, setHoveredColumn] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const { months_order, kontrahenci_sorted, pivot, suma_row_list } = data;

    const filteredKontrahenci = React.useMemo(()=>{
        if(!data || !data.kontrahenci_sorted){
            return [];
        }

        if(!globalFilter){
            return kontrahenci_sorted;
        }
        const filteredValue = globalFilter.toLowerCase();
        return kontrahenci_sorted.filter(kontrahent=>kontrahent.toLowerCase().includes(filteredValue));
        
    }, [globalFilter, kontrahenci_sorted, data]);
    
    if (!data || !data.pivot) {
        return <p className="loading-text">Brak danych do wyświetlenia w tabeli.</p>;
    }

    const formatNumber = (num) => {
        if (num === null || num === undefined || num === 0) return '-';
        return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const getSortIndicator = (key) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <span className="sort-indicator-placeholder"></span>;
        }
        return sortConfig.direction === 'asc' ? <span className="sort-indicator">▲</span> : <span className="sort-indicator">▼</span>;
    };

    const handleMouseEnter = (colIndex) => {
        setHoveredColumn(colIndex);
    };

    const handleMouseLeave = () => {
        setHoveredColumn(null);
    };

    const headers = [
        { key: 'Kontrahent', label: 'Kontrahent' },
        ...months_order.map(m => ({ key: m, label: m })),
        { key: 'Suma roczna', label: 'Suma roczna' }
    ];


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
        <div className="analiza-table-wrapper">
            <table className="analiza-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th 
                                key={header.key} 
                                className={`analiza-th ${hoveredColumn === index ? 'column-hover' : ''}`}
                                onClick={() => requestSort(header.key)}
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="th-content">
                                    {header.label}
                                    {getSortIndicator(header.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredKontrahenci.length > 0 ? (
                        filteredKontrahenci.map(kontrahent => (
                        <tr key={kontrahent}>
                            <td 
                                data-label="Kontrahent"
                                className={`analiza-td td-kontrahent ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(0)}
                                onMouseLeave={handleMouseLeave}
                            >{kontrahent}</td>
                            {months_order.map((month, index) => (
                                <td 
                                    key={month} 
                                    data-label={month}
                                    className={`analiza-td text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(index + 1)}
                                    onMouseLeave={handleMouseLeave}
                                >{formatNumber(pivot[kontrahent][month])}</td>
                            ))}
                            <td 
                                data-label="Suma roczna"
                                className={`analiza-td text-right td-total ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(13)}
                                onMouseLeave={handleMouseLeave}
                            >{formatNumber(pivot[kontrahent]['Suma roczna'])}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={headers.length} className="analiza-td text-center">
                            Brak wyników wyszukiwania.
                        </td>
                    </tr>
                )}
                </tbody>
                {filteredKontrahenci.length > 0 && (
                    <tfoot>
                        <tr>
                            <td 
                                className={`analiza-tf ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(0)}
                                onMouseLeave={handleMouseLeave}
                            >SUMA</td>
                            {suma_row_list.slice(0, 12).map((sum, index) => (
                                <td 
                                    key={`sum-${index}`} 
                                    className={`analiza-tf text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(index + 1)}
                                    onMouseLeave={handleMouseLeave}
                                >{formatNumber(sum)}</td>
                            ))}
                            <td 
                                className={`analiza-tf text-right td-total ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(13)}
                                onMouseLeave={handleMouseLeave}
                            >{formatNumber(suma_row_list[12])}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
        </div>
    );
};

export default AnalizaTable;
