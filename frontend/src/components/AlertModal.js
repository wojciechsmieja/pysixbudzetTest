import {useState, useEffect} from 'react'

const AlertModal = ({isOpen, onClose, title, children, }) => {
    if(!isOpen){
        return null;
    }
    return(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e =>e.stopPropagation()}>
                <h2>{title}</h2>
                <div className='modal-body' style={{paddingBottom:'2rem', lineHeight:'1.6'}}>
                    {children}
                </div>
                <div className='button-container'>
                    <button type="button" onClick={onClose} className='modal-button modal-button-submit'>OK</button>
                </div>
            </div>
        </div>
    )
}
export default AlertModal;