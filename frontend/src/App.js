import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import './App.css';

// Import page components
import Analiza from './pages/Analiza';
import Podsumowanie from './pages/Podsumowanie';
import Wynagrodzenia from './pages/Wynagrodzenia';
import Dokumenty from './pages/Dokumenty';

function App() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading application...</div>
    }

    return (
        <div className="App">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                    path="/*" 
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}

// Layout for authenticated users
const MainLayout = () => {
    return (
        <>
            <Navbar />
            <main style={{ padding: '1rem' }}>
                <Routes>
                    <Route path="/analiza" element={<Analiza />} />
                    <Route path="/podsumowanie" element={<Podsumowanie />} />
                    <Route path="/wynagrodzenia" element={<Wynagrodzenia />} />
                    <Route path="/dokumenty" element={<Dokumenty />} />
                    {/* Redirect root to /analiza */}
                    <Route path="/" element={<Navigate to="/analiza" />} />
                </Routes>
            </main>
        </>
    )
}

export default App;
