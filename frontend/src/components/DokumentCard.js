import React from 'react';
import './DokumentCard.css';

const DokumentCard = ({ document, onEdit, onDelete }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
    };

    const getTagColor = (tag) => {
        const colors = {
            'FAKTURA': '#38bdf8', // blue
            'PRZELEW': '#34d399', // green
            'GOTÓWKA': '#facc15', // yellow
            'WYPŁATY': '#fb7185', // rose
            'INNE': '#a78bfa', // violet
        };
        return colors[tag.toUpperCase()] || '#9ca3af'; // default grey
    };

    return (
        <div className="dokument-card">
            <div className="card-header">
                <span className="document-number">{document['Nr dokumentu']}</span>
                <span className="document-type">{document.Rodzaj || 'Brak Rodzaju'}</span>
            </div>
            <div className="card-body">
                <p className="card-kontrahent">{document.Kontrahent}</p>
                <div className="card-details">
                    <div className="detail-item">
                        <span className="detail-label">Data wystawienia:</span>
                        <span className="detail-value">{document['Data wystawienia']}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Termin płatności:</span>
                        <span className="detail-value">{document['Termin płatności']}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Kwota netto:</span>
                        <span className="detail-value amount">{formatCurrency(document['Kwota netto'])}</span>
                    </div>
                    {document['Kwota vat'] !== undefined && (
                        <div className="detail-item">
                            <span className="detail-label">Kwota VAT:</span>
                            <span className="detail-value amount">{formatCurrency(document['Kwota vat'])}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <span className="detail-label">Razem:</span>
                        <span className="detail-value amount total">{formatCurrency(document.Razem)}</span>
                    </div>
                </div>
                <div className="card-tags">
                    {document.Etykiety && document.Etykiety.split(',').map(tag => (
                        <span 
                            key={tag.trim()} 
                            className="tag-chip"
                            style={{ backgroundColor: getTagColor(tag.trim())}}>
                            {tag.trim()}
                        </span>
                    ))}
                </div>
            </div>
            <div className="card-actions">
                <button className="action-button action-button-edit" onClick={() => onEdit(document)}>Edytuj</button>
                <button className="action-button action-button-delete" onClick={() => onDelete(document['Lp.'])}>Usuń</button>
            </div>
        </div>
    );
};

export default DokumentCard;
