import axios from 'axios';

// Global axios interceptor to handle expired/invalid JWT tokens.
// When any API call returns 401, this clears the stale token from
// localStorage and redirects to login — preventing infinite loading loops.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      // Token is expired or invalid — clean up and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
