
// @ts-ignore
const BASE_RESERVATION_URL = process.env.OWNIMA_API_URL || 'https://stage.ownima.com/api/v1/reservation';

// Derive Auth URL from the reservation URL (assuming standard /api/v1 structure)
// e.g., https://stage.ownima.com/api/v1/reservation -> https://stage.ownima.com/api/v1/auth/access-token
// Ensure BASE_RESERVATION_URL is a string before calling replace
const AUTH_URL = (BASE_RESERVATION_URL || '').replace('/reservation', '/auth/access-token');

const TOKEN_KEY = 'ownima_token';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  login: async (username: string, password: string): Promise<void> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('user_type', 'owner'); 

    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept': 'application/json',
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
