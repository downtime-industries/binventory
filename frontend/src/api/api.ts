import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async () => {
    window.location.href = `${API_URL}/auth/login`;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  },
  
  handleCallback: async (token: string) => {
    localStorage.setItem('token', token);
  }
};

// Items API
export const itemsAPI = {
  getItems: async (params: any = {}) => {
    const response = await api.get('/items', { params });
    return response.data;
  },
  
  getItem: async (id: number) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },
  
  createItem: async (itemData: any) => {
    const response = await api.post('/items', itemData);
    return response.data;
  },
  
  updateItem: async (id: number, itemData: any) => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },
  
  deleteItem: async (id: number) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
  
  searchAutocomplete: async (query: string) => {
    const response = await api.get('/search/autocomplete', {
      params: { q: query }
    });
    return response.data;
  }
};

// Tags API
export const tagsAPI = {
  getTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },
  
  getTag: async (tag: string) => {
    const response = await api.get(`/tags/${tag}`);
    return response.data;
  }
};

// Areas API
export const areasAPI = {
  getAreas: async () => {
    const response = await api.get('/areas');
    return response.data;
  },
  
  getArea: async (area: string) => {
    const response = await api.get(`/areas/${area}`);
    return response.data;
  }
};

// Containers API
export const containersAPI = {
  getContainers: async (params: any = {}) => {
    const response = await api.get('/containers', { params });
    return response.data;
  },
  
  getContainer: async (container: string, params: any = {}) => {
    const response = await api.get(`/containers/${container}`, { params });
    return response.data;
  }
};

// Bins API
export const binsAPI = {
  getBins: async (params: any = {}) => {
    const response = await api.get('/bins', { params });
    return response.data;
  },
  
  getBin: async (bin: string, params: any = {}) => {
    const response = await api.get(`/bins/${bin}`, { params });
    return response.data;
  }
};
