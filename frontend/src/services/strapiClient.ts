import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:1337/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});


export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
