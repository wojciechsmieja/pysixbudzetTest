import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import AddDataModal from '../components/AddDataModal';
import DokumentyTable from '../components/DokumentyTable'; // <-- Import the new table
import './Dokumenty.css';
import '../components/DokumentyTable.css'; // <-- Import the table's CSS
import PromptModal from '../components/PromptModal';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

// Inline SVG Icons for functional buttons
const ImportIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const AddIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const DownloadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const ClearIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>);

const DokumentyComponent = () => {
    const [data, setData] = useState({ rows: [], headers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertContent, setAlertContent] = useState({title: '', message: ''});
    const [recordToDeleteLp, setRecordToDeleteLp] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [dataType, setDataType] = useState('Przychody');
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { typ: dataType, year: year };
            const response = await api.data.getDokumenty(params);
            setData(response.data || { rows: [], headers: [] });
        } catch (err) {
            setError(`Nie udało się pobrać danych: ${err.message}`);
            setData({ rows: [], headers: [] }); // Reset data on error
        } finally {
            setLoading(false);
        }
    }, [dataType, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (lp) => {
        if (window.confirm(`Czy na pewno chcesz usunąć rekord o Lp. ${lp}?`)) {
            const oldData = { ...data };
            const newRows = data.rows.filter(row => row['Lp.'] !== lp);
            setData({ ...data, rows: newRows });

            try {
                await api.data.deleteDokument({ lp: lp, typ: dataType });
            } catch (err) {
                setError(`Nie udało się usunąć rekordu: ${err.message}. Przywracanie.`);
                setData(oldData);
            }
        }
    };

    const handleDownload = async () => {
        try {
            const response = await api.file.download();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'budzet.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setError(`Nie udało się pobrać pliku: ${err.message}`);
        }
    };

    const handleClearSheet = () => {
        setIsPromptOpen(true);
    };


    const handleAddOrUpdateData = async (formData) => {
        try {
            setLoading(true);
            if (editingDocument) { // It's an edit operation
                await api.data.updateDokument({ lp: editingDocument['Lp.'], typ: dataType, new_data: formData });
            } else { // It's an add operation
                await api.data.addData({ typ: dataType, new_record: formData });
            }
            setIsModalOpen(false);
            setEditingDocument(null); // Clear editing state
            await fetchData();
        } catch (err) {
            setError(`Nie udało się zapisać danych: ${err.message}`);
            setLoading(false);
        }
        
    };

    const handleOpenAddModal = () => {
        setEditingDocument(null); // Ensure add mode
        setIsModalOpen(true);
    };

    const handleOpenEditModal = useCallback((document) => {
        setEditingDocument(document); // Set document for editing
        setIsModalOpen(true);
    }, []);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingDocument(null); // Clear editing state on close
    };

    const handlePromptModalClose = () => {
        setIsPromptOpen(false);
    }
    const handleAlertModalClose = () =>{
        setIsAlertOpen(false);
    }
    const handleConfirmModalClose = () =>{
        setIsConfirmOpen(false);
    }
    const handleDeleteClick = (lp) =>{
        setRecordToDeleteLp(lp);
        setIsConfirmOpen(true);
    }

    const handleConfirmDelete = async () => {
        if(!recordToDeleteLp) return;

        const oldData = {...data};
        const newRows = data.rows.filter(row => row['Lp.'] !==recordToDeleteLp);
        setData({...data, rows:newRows});

        setIsConfirmOpen(false);

        try{
            await api.data.deleteDokument({lp: recordToDeleteLp, typ: dataType});
        }catch (err) {
            setError(`Nie udało się usunąć rekordu ${err.message}. Przywracanie.`);
            setData(oldData);
        }finally {
            setRecordToDeleteLp(null);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.xlsx')) {
                setError('Proszę wybrać plik w formacie .xlsx');
                return;
            }
            try {
                setLoading(true);
                const response = await api.file.upload(file);
                setAlertContent({title: "Informacja o imporcie", message:response.data.message});
                setIsAlertOpen(true);
                await fetchData();
            } catch (err) {
                const message = err.response ? err.response.data.message : err.message;
                setError(`Nie udało się zaimportować pliku: ${message}`);
                setLoading(false);
            }
        };
        input.click();
    };

    return (
        <div className="page-wrapper" id="website-top">
            <AddDataModal 
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleAddOrUpdateData}
                dataType={dataType}
                initialData={editingDocument} // Pass data for editing
            />
            <PromptModal
                isOpen={isPromptOpen}
                onClose={handlePromptModalClose}
                onConfirm={async () =>{
                    setIsPromptOpen(false);
                    try{
                        setLoading(true);
                        await api.data.clearSheet({typ: dataType});
                        await fetchData();
                    }catch (err){
                        setError(`Nie udało się wyczyścić danych: ${err.message}`);
                    }finally{
                        setLoading(false);
                    }
                }}
                title="Potwierdź czyszczenie danych"
                confirmationText="USUŃ"
                >
                    <p>Ta operacja usunie wszystkie dane z arkusza {dataType}. Wpisz <strong>USUŃ</strong>, aby potwierdzić operację.</p>
                </PromptModal>
                <AlertModal
                    isOpen={isAlertOpen}
                    onClose={handleAlertModalClose}
                    title={alertContent.title}>
                        <p>{alertContent.message}</p>
                </AlertModal>
                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={handleConfirmModalClose}
                    onConfirm={handleConfirmDelete}
                    title={"Potwierdzenie usunięcia?"}>
                    <p>`Czy na pewno chcesz usunąć rekord o Lp. ${recordToDeleteLp}?`</p>
                </ConfirmModal>
            <header className="page-header">
                <h1>Zarządzanie dokumentami</h1>
            </header>

            <div className="filter-bar">
                <div className="filter-group">
                    <span className="filter-label">Rok:</span>
                    <div className="filter-chips">
                        <button className="chip" onClick={() => setYear(y => y - 1)} disabled={loading || (data && data.min_year >= year)}>‹ {year - 1}</button>
                        <button className="chip active">{year}</button>
                        <button className="chip" onClick={() => setYear(y => y + 1)} disabled={loading || (data && data.max_year <= year)}>{year + 1} ›</button>
                    </div>
                </div>
                <div className="filter-group">
                    <span className="filter-label">Typ:</span>
                    <div className="filter-chips">
                        <button className={`chip ${dataType === 'Przychody' ? 'active' : ''}`} onClick={() => setDataType('Przychody')} disabled={loading}>Przychody</button>
                        <button className={`chip ${dataType === 'Wydatki' ? 'active' : ''}`} onClick={() => setDataType('Wydatki')} disabled={loading}>Wydatki</button>
                    </div>
                </div>
                <div className="filter-group">
                    <span className="filter-label">Akcje:</span>
                    <div className="filter-chips actions-chips">
                        <button className="chip" onClick={handleImport}><ImportIcon /> Importuj</button>
                        <button className="chip" onClick={handleOpenAddModal}><AddIcon /> Dodaj dane</button>
                        <button className="chip" onClick={handleDownload}><DownloadIcon /> Pobierz całość</button>
                        <button className="chip" onClick={handleClearSheet}><ClearIcon /> Wyczyść</button>
                    </div>
                </div>
            </div>

            <main className="content-area">
                {loading && <p className="loading-text">Ładowanie danych...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && (
                    <DokumentyTable
                        data={data.rows}
                        dataType={dataType} // <-- Pass data type to table
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteClick}
                    />
                )}
            </main>
            <div className='scroll-up'><button className='chip scroll-web' onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Powróć na górę</button></div>
        </div>
    );
};

export { DokumentyComponent };
export default DokumentyComponent;
