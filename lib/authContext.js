import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    const response = await authAPI.getProfile();
                    setUser(response.data);
                }
            } catch (err) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userType');
                localStorage.removeItem('userId');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const register = async (userData) => {
        setError(null);
        try {
            const response = await authAPI.register(userData);
            const { user: userResponse, token } = response.data;

            localStorage.setItem('authToken', token);
            localStorage.setItem('userType', userResponse.user_type);
            localStorage.setItem('userId', userResponse.id);

            setUser(userResponse);
            return userResponse;
        } catch (err) {
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                'Registration failed';
            setError(errorMsg);
            throw err;
        }
    };

    const login = async (username, password) => {
        setError(null);
        try {
            const response = await authAPI.login(username, password);
            const { user: userData, token } = response.data;

            localStorage.setItem('authToken', token);
            localStorage.setItem('userType', userData.user_type);
            localStorage.setItem('userId', userData.id);

            setUser(userData);
            return userData;
        } catch (err) {
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                'Login failed';
            setError(errorMsg);
            throw err;
        }
    };

    const googleLogin = async (idToken, userType) => {
        setError(null);
        try {
            const response = await authAPI.googleAuth(idToken, userType);
            const { user: userData, token } = response.data;

            localStorage.setItem('authToken', token);
            localStorage.setItem('userType', userData.user_type);
            localStorage.setItem('userId', userData.id);

            setUser(userData);
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                'Google login failed';
            setError(errorMsg);
            throw err;
        }
    };

    const logout = async () => {
        setError(null);
        try {
            await authAPI.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userId');
            setUser(null);
        }
    };

    const clearError = () => setError(null);

    const value = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        register,
        login,
        googleLogin,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
