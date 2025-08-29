import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import DokumentCard from './DokumentCard';
import './DokumentyTable.css';

// Helper function to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value || 0);
};

// Reusable Icon components
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4 4 4m-8 4h13M3 12h9m-9 4h6m4 0l4-4 4 4H3z"/></svg>;

const columnHelper = createColumnHelper();





const DokumentyTable = ({ data, dataType, onEdit, onDelete }) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [expanded, setExpanded] = useState({});

    const columns = useMemo(() => {
        const baseColumns = [
            columnHelper.accessor('expander', {
                header: () => null,
                id: 'expander',
                cell: ({ row }) => (
                    <button
                        onClick={() => setExpanded(old => ({...old, [row.id]: !old[row.id]}))}
                        className={'expander-button'}
                    >
                        {expanded[row.id] ? '▼' : '▶'}
                    </button>
                ),
            }),
            
            columnHelper.accessor('Nr dokumentu', { header: 'Nr dok.', cell: info => info.getValue() }),
            columnHelper.accessor('Kontrahent', { header: 'Kontrahent', cell: info => info.getValue() })
        ];

        const incomeColumns = [
            columnHelper.accessor('Rodzaj', { header: 'Rodzaj', cell: info => info.getValue() }),
            columnHelper.accessor('Metoda', { header: 'Metoda', cell: info => info.getValue() })
        ];

        const expenseColumns = [
            columnHelper.accessor('Kwota vat', {
                header: 'VAT',
                cell: info => <span className="currency-vat">{formatCurrency(info.getValue())}</span>,
            })
        ];

        const finalColumns = [
            columnHelper.accessor('Data wystawienia', { header: 'Wystawiono', cell: info => info.getValue() }),
            columnHelper.accessor('Termin płatności', { header: 'Termin', cell: info => info.getValue() }),
            columnHelper.accessor('Kwota netto', {
                header: 'Netto',
                cell: info => <span className="currency-netto">{formatCurrency(info.getValue())}</span>,
            }),
            // VAT column will be inserted here for expenses
            columnHelper.accessor('Razem', {
                header: 'Razem',
                cell: info => <span className="currency-razem">{formatCurrency(info.getValue())}</span>,
            }),
            columnHelper.accessor('Zapłacono', {
                header: 'Zapłacono',
                cell: info => <span className="currency-zaplacono">{formatCurrency(info.getValue())}</span>,
            }),
            columnHelper.accessor('Pozostało', {
                header: 'Pozostało',
                cell: info => {
                    const pozostalo = info.getValue();
                    return <span className={pozostalo > 0 ? "currency-pozostalo-due" : "currency-pozostalo"}>{formatCurrency(pozostalo)}</span>;
                }
            }),
            columnHelper.accessor('Etykiety', {
                header: 'Etykiety',
                cell: info => (
                    <div className="tags-cell">
                        {info.getValue()?.split(',').map(tag => (
                            <span key={tag} className="tag-chip">{tag.trim()}</span>
                        ))}
                    </div>
                ),
            }),
            columnHelper.accessor('actions', {
                header: 'Akcje',
                id: 'actions',
                cell: ({ row }) => (
                    <div className="actions-cell">
                        <button onClick={() => onEdit(row.original)} className="action-icon-button" title="Edytuj">
                            <EditIcon />
                        </button>
                        <button onClick={() => onDelete(row.original['Lp.'])} className="action-icon-button" title="Usuń">
                            <DeleteIcon />
                        </button>
                    </div>
                ),
            }),
        ];

        if (dataType === 'Przychody') {
            // Insert Rodzaj and Metoda after Kontrahent
            baseColumns.splice(4, 0, ...incomeColumns);
        } 

        let combinedColumns = [...baseColumns, ...finalColumns];

        if (dataType === 'Wydatki') {
            // Find index of 'Kwota netto' and insert 'VAT' after it
            const nettoIndex = combinedColumns.findIndex(col => col.accessorKey === 'Kwota netto');
            if (nettoIndex !== -1) {
                combinedColumns.splice(nettoIndex + 1, 0, ...expenseColumns);
            }
        }

        return combinedColumns;

    }, [dataType, onEdit, onDelete, expanded]);

    const table = useReactTable({
        data,
        columns,
        getRowId: row => row['Lp.'],
        state: {
            globalFilter,
            sorting,
            expanded,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    return (
        <div className="dokumenty-table-container">
            <div className="documents-table-toolbar">
                <input
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value.replace(/,/g,'.'))}
                    className="search-input"
                    placeholder="Wyszukaj w tabeli..."
                />
            </div>
            <div className="pagination-controls">
                <div className="pagination-nav">
                    <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                        {'<<'}
                    </button>
                    <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        {'<'}
                    </button>
                    <span className="page-info">
                        Strona{' '}
                        <strong>
                            {table.getState().pagination.pageIndex + 1} z {table.getPageCount()}
                        </strong>
                    </span>
                    <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        {'>'}
                    </button>
                    <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                        {'>>'}
                    </button>
                </div>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 25, 50, 100].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Pokaż {pageSize}
                        </option>
                    ))}
                </select>
            </div>
            <div className="table-wrapper">
                <table className="dokumenty-table">
                    <thead className="table-header-sticky">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: ' 🔼',
                                            desc: ' 🔽',
                                        }[header.column.getIsSorted()] ?? null}
                                        {header.column.getCanSort() && !header.column.getIsSorted() && <span className="sort-icon"><SortIcon/></span>}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <React.Fragment key={row.id}>
                                <tr>
                                    {row.getVisibleCells().map(cell => {
                                        const headerDef = cell.column.columnDef.header;
                                        const label = typeof headerDef === 'string' ? headerDef : '';
                                        return (
                                            <td key={cell.id} data-label={label}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {expanded[row.id] && (
                                    <tr className="expanded-row">
                                        <td colSpan={columns.length}>
                                            <DokumentCard document={row.original} onEdit={onEdit} onDelete={onDelete} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DokumentyTable;