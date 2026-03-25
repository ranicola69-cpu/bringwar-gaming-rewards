// Overrides the global fetch to automatically inject the JWT token into API requests
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  }

  if (url.includes('/api/')) {
    const token = localStorage.getItem('bringwar_token');
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      init.headers = headers;
    }
  }

  return originalFetch(input, init);
};

export {};
