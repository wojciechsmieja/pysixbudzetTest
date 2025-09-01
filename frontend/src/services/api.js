import axios from 'axios';
import { redirect } from 'react-router-dom';

const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to handle 401 errors
apiClient.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response.status === 401 && window.location.pathname !== '/login') {
        // For example, redirect to login or refresh token
        // For now, we just let the caller handle it
        window.location.href = '/login';

    }
    return Promise.reject(error);
});

export const auth = {
    checkStatus: () => apiClient.get('/auth/status'),
    login: (username, password) => apiClient.post('/auth/login', { username, password }),
    logout: () => apiClient.post('/auth/logout'),
};

export const data = {
    getAnaliza: (params) => apiClient.get('/data/analiza', { params }),
    getDokumenty: (params) => apiClient.get('/data/dokumenty', { params }),
    getPodsumowanie: (params) => apiClient.get('/data/podsumowanie', { params }),
    getWynagrodzenia: (params) => apiClient.get('/data/wynagrodzenia', { params }),
    deleteDokument: (payload) => {
        const { lp, typ } = payload;
        return apiClient.delete(`/documents/${lp}?typ=${typ}`);
    },
    updateDokument: (payload) => {
        const { lp, typ, new_data } = payload;
        return apiClient.put(`/documents/${lp}?typ=${typ}`, new_data);
    },
    clearSheet: (payload) => apiClient.post('/sheet/clear', payload),
    addData: (payload) => apiClient.post('/data/add', payload),
};

export const file = {
    download: () => apiClient.get('/file/download', { responseType: 'blob' }),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/file/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

const api = {auth, data, file};

export default api;
