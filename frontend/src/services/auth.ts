import Cookies from 'js-cookie';

const TOKEN_KEY = 'bairamburguer_token';

export const setAuthToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, { expires: 1, path: '/' }); // Expira em 1 dia
};

export const getAuthToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const removeAuthToken = () => {
  Cookies.remove(TOKEN_KEY, { path: '/' });
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
