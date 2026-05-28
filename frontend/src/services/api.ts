import { getAuthToken } from './auth';

const API_BASE_URL = "/api";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  
  // Se existir o token, adicione o header Authorization
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Lida com o Content-Type: remove para FormData (para o browser gerar o boundary)
  // ou define como application/json por padrão.
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  return response;
};
