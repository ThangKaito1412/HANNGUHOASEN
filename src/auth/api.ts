const TOKEN_KEY = 'hnhs_student_token_v1';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

/** fetch kèm token đăng nhập của học viên (nếu có). */
export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const t = getToken();
  if (t) headers.set('Authorization', 'Bearer ' + t);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(url, {...init, headers});
}

export const CENTER = {
  phone: '0813 616 813',
  phoneLink: 'tel:0813616813',
  zalo: 'https://zalo.me/0813616813',
};
