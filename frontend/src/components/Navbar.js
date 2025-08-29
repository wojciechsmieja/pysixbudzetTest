import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

// Inline SVG Icons
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>;
const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const SalaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8s1.5 2 2 4c-.5 2-2 4-2 4M8 8s-1.5 2-2 4c.5 2 2 4 2 4M9 12h6"/></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 16 22 12 17 8"/><line x1="22" y1="12" x2="10" y2="12"/></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;


const Navbar = () => {
    const { logout } = useAuth();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    const getNavLinkClass = ({ isActive }) => {
        return isActive ? "nav-button active" : "nav-button";
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    }

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-logo">PysixBudżet</Link>
                
                <div className="nav-links-desktop">
                    <div className="nav-links">
                        <NavLink to="/analiza" className={getNavLinkClass}><ChartIcon /> Analiza</NavLink>
                        <NavLink to="/podsumowanie" className={getNavLinkClass}><SummaryIcon /> Podsumowanie</NavLink>
                        <NavLink to="/wynagrodzenia" className={getNavLinkClass}><SalaryIcon /> Wynagrodzenia</NavLink>
                        <NavLink to="/dokumenty" className={getNavLinkClass}><DocumentIcon /> Dokumenty</NavLink>
                    </div>
                </div>
                <div className="nav-links-desktop nav-links">
                    <button onClick={logout} className="nav-button logout-button"><LogoutIcon /> Wyloguj</button>
                </div>
                <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                    <MenuIcon />
                </div>

            </nav>
            <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}></div>
            <div className={`mobile-nav-panel ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-nav-header">
                    <div className="close-icon" onClick={toggleMobileMenu}>
                        <CloseIcon />
                    </div>
                </div>
                <div className="mobile-nav-links">
                    <NavLink to="/analiza" className={getNavLinkClass} onClick={closeMobileMenu}><ChartIcon /> Analiza</NavLink>
                    <NavLink to="/podsumowanie" className={getNavLinkClass} onClick={closeMobileMenu}><SummaryIcon /> Podsumowanie</NavLink>
                    <NavLink to="/wynagrodzenia" className={getNavLinkClass} onClick={closeMobileMenu}><SalaryIcon /> Wynagrodzenia</NavLink>
                    <NavLink to="/dokumenty" className={getNavLinkClass} onClick={closeMobileMenu}><DocumentIcon /> Dokumenty</NavLink>
                    <button onClick={() => { logout(); closeMobileMenu(); }} className="nav-button logout-button"><LogoutIcon /> Wyloguj</button>
                </div>
            </div>
        </>
    );
};

export default Navbar;
