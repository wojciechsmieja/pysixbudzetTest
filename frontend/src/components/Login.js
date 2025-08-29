import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Proszę podać nazwę użytkownika i hasło.');
            return;
        }

        setLoading(true);
        const result = await auth.login(username, password);
        setLoading(false);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2 className="login-title">Zaloguj się!</h2>
                <p className="login-subtitle">Zaloguj się, aby kontynuować</p>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Nazwa użytkownika:</label>
                        <div className="input-wrapper">
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="np. jan.kowalski"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Hasło:</label>
                        <div className="input-wrapper">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <button type="submit" className={`login-button ${loading ? 'loading' : ''}`} disabled={loading}>
                        {loading ? <div className="spinner"></div> : 'Zaloguj'}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default Login;
