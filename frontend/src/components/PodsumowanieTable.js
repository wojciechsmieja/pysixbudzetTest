import React, { useState } from 'react';
import './PodsumowanieTable.css';

const PodsumowanieTable = ({ data, title }) => {
    const [hoveredColumn, setHoveredColumn] = useState(null);

    if (!data || !data.pivot) {
        return <p className="loading-text">Brak danych do wyświetlenia w tabeli {title}.</p>;
    }

    const { branches_sorted, pivot, suma_row_list } = data;
    const months_order = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

    const formatNumber = (num) => {
        if (num === null || num === undefined || num === 0) return '-';
        return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const handleMouseEnter = (colIndex) => {
        setHoveredColumn(colIndex);
    };

    const handleMouseLeave = () => {
        setHoveredColumn(null);
    };

    return (
        <div className="summary-table-block">
            <h3 className="table-title">Podsumowanie - {title}</h3>
            <div className="summary-table-wrapper">
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th 
                                className="summary-th"
                                onMouseEnter={() => handleMouseEnter(0)}
                                onMouseLeave={handleMouseLeave}
                            >Gałąź</th>
                            {months_order.map((month, index) => (
                                <th 
                                    key={month} 
                                    className={`summary-th text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(index + 1)}
                                    onMouseLeave={handleMouseLeave}
                                >{month}</th>
                            ))}
                            <th 
                                className={`summary-th text-right ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(13)}
                                onMouseLeave={handleMouseLeave}
                            >Suma roczna</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches_sorted.map(branch => (
                            <tr key={branch}>
                                <td 
                                    data-label="Gałąź"
                                    className={`summary-td td-branch ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(0)}
                                    onMouseLeave={handleMouseLeave}
                                >{branch}</td>
                                {months_order.map((month, index) => (
                                    <td 
                                        key={month} 
                                        data-label={month}
                                        className={`summary-td text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                        onMouseEnter={() => handleMouseEnter(index + 1)}
                                        onMouseLeave={handleMouseLeave}
                                    >{formatNumber(pivot[branch][month])}</td>
                                ))}
                                <td 
                                    data-label="Suma roczna"
                                    className={`summary-td text-right td-total ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(13)}
                                    onMouseLeave={handleMouseLeave}
                                >{formatNumber(pivot[branch]['Suma roczna'])}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td 
                                className={`summary-tf ${hoveredColumn === 0 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(0)}
                                onMouseLeave={handleMouseLeave}
                            >SUMA</td>
                            {suma_row_list.slice(0, 12).map((sum, index) => (
                                <td 
                                    key={`sum-${index}`} 
                                    className={`summary-tf text-right ${hoveredColumn === index + 1 ? 'column-hover' : ''}`}
                                    onMouseEnter={() => handleMouseEnter(index + 1)}
                                    onMouseLeave={handleMouseLeave}
                                >{formatNumber(sum)}</td>
                            ))}
                            <td 
                                className={`summary-tf text-right td-total ${hoveredColumn === 13 ? 'column-hover' : ''}`}
                                onMouseEnter={() => handleMouseEnter(13)}
                                onMouseLeave={handleMouseLeave}
                            >{formatNumber(suma_row_list[12])}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default PodsumowanieTable;