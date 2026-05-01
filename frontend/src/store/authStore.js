import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isAuthenticated: true, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', loading: false });
            throw error;
        }
    },

    register: async (firstName, lastName, email, password) => {
        set({ loading: true, error: null });
        try {
            await api.post('/auth/register', { firstName, lastName, email, password });
            set({ loading: false });
        } catch (error) {
            set({ error: error.response?.data || 'Registration failed', loading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));

export default useAuthStore;
