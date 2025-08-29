import React, { useState, useEffect } from 'react';
import './AddDataModal.css'; // Import the new CSS file

const initialPrzychodyState = {
    'Nr dokumentu': '',
    'Kontrahent': '',
    'Rodzaj': 'Faktura',
    'Data wystawienia': new Date().toISOString().split('T')[0],
    'Termin płatności': new Date().toISOString().split('T')[0],
    'Zapłacono': 0,
    'Pozostało': 0,
    'Razem': 0,
    'Kwota netto': 0,
    'Metoda': 'przelew',
    'Etykiety': '',
};
const initialWydatkiState = {
    'Nr dokumentu': '',
    'Kontrahent': '',
    'Data wystawienia': new Date().toISOString().split('T')[0],
    'Termin płatności': new Date().toISOString().split('T')[0],
    'Zapłacono': 0,
    'Pozostało': 0,
    'Razem': 0,
    'Kwota netto': 0,
    'Kwota vat': 0,
    'Etykiety': '',
};

const AddDataModal = ({ isOpen, onClose, onSubmit, dataType, initialData }) => {

    const [formData, setFormData] = useState({});

    // Function to check if a field should be a date
    const isDateField = (fieldName) => {
        const lowerCaseFieldName = fieldName.toLowerCase();
        return lowerCaseFieldName.includes('data') || lowerCaseFieldName.includes('termin');
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Ensure date fields are formatted correctly
                const formattedData = { ...initialData };
                Object.keys(formattedData).forEach(key => {
                    if (isDateField(key) && formattedData[key]) {
                        formattedData[key] = new Date(formattedData[key]).toISOString().split('T')[0];
                    }
                });
                setFormData(formattedData);
            } else {
                setFormData(dataType === 'Przychody' ? initialPrzychodyState : initialWydatkiState);
            }
        }
    }, [isOpen, dataType, initialData]);

    if (!isOpen) return null;

    const fields = Object.keys(dataType === 'Przychody' ? initialPrzychodyState : initialWydatkiState);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // Convert back to number if the input type is number
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{initialData ? `Edytuj ${dataType.slice(0, -1)}` : `Dodaj ${dataType.slice(0, -1)}`}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    {fields.map(field => (
                        <div key={field} className="form-group">
                            <label className="form-label">{field}</label>
                            <input
                                className="form-input"
                                type={isDateField(field) ? 'date' : (typeof formData[field] === 'number' ? 'number' : 'text')}
                                name={field}
                                value={formData[field] || ''}
                                onChange={handleChange}
                                required={field !== 'Lp.'}
                                disabled={field === 'Lp.'}
                            />
                        </div>
                    ))}
                    <div className="button-container">
                        <button type="button" onClick={onClose} className="modal-button modal-button-cancel">Anuluj</button>
                        <button type="submit" className="modal-button modal-button-submit">{initialData ? 'Zapisz Zmiany' : 'Dodaj'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDataModal;
