import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth as api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await api.checkStatus();
                if (response.status === 200 && response.data.user) {
                    setUser(response.data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
                console.error("Authentication check failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.login(username, password);
            // Check for both a 200 status and a success message in the body
            if (response.status === 200 && response.data.status === 'success') {
                setUser(response.data.user);
                return { success: true };
            } else {
                // Handle cases where server returns 200 but login failed (shouldn't happen with good practice)
                return { success: false, message: response.data.message || 'Logowanie nie powiodło się.' };
            }
        } catch (error) {
            let message = 'Logowanie nie powiodło się. Sprawdź konsolę, aby uzyskać więcej informacji.';
            if (error.response && error.response.data && error.response.data.message) {
                message = error.response.data.message;
            }
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
