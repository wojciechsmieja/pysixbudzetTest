
import './AddDataModal.css';

const ConfirmModal = ({isOpen, onClose, onConfirm, title, children}) =>{
    if(!isOpen){
        return null;
    }
    return (
        <div className='modal-overlay' onClick={onClose}>
            <div className='modal-content' onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>
                <div className='modal-body' style={{paddingBottom: '2rem'}}>
                    {children}
                </div>
                <div className='button-container'>
                    <button type="button" onClick={onClose} className='modal-button modal-button-cancel'>Anuluj</button>
                    <button type='submit' onClick={onConfirm} className='modal-button modal-button-submit'>Tak, potwierdź</button>
                </div>
            </div>
        </div>
    )
}
export default ConfirmModal;

