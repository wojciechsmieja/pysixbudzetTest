import {useState, useEffect} from 'react';
import './AddDataModal.css';

const PromptModal = ({isOpen, onClose, onConfirm, title, children, confirmationText}) =>{
    const [inputValue, setInputValue] = useState("");
    useEffect(()=>{
        if(isOpen){
            setInputValue('');
        }
    }, [isOpen]);
    if(!isOpen){
        return null;
    }

    const canConfirm = inputValue ===confirmationText;

    const handleConfirm = () => {
        if(canConfirm){
            onConfirm();
        }
    }
    return (
        <div className='modal-overlay' onClick={onClose}>
            <div className='modal-content' onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>
                <div className='modal-body' style={{paddingBottom: '2rem'}}>
                    {children}
                    <input
                        className='form-input'
                        type='text'
                        value={inputValue}
                        onChange={(e)=>setInputValue(e.target.value)}
                        placeholder={`Wpisz "${confirmationText}", aby potwierdzić`}
                        style = {{marginTop: '1.5rem', width: '90%'}}
                    />
                </div>
                <div className='button-container'>
                    <button type="button" onClick={onClose} className='modal-button modal-button-cancel'>Anuluj</button>
                    <button type='submit' onClick={handleConfirm} className='modal-button modal-button-submit' disabled={!canConfirm}>Potwierdź</button>
                </div>
            </div>
        </div>
    )
}
export default PromptModal;

