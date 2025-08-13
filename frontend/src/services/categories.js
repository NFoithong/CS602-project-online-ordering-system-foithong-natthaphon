import { api } from './api';

export const Categories = {
  list: () => api('/api/categories'),
  create: (name) => api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  rename: (id, name) => api(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  remove: (id, { force } = {}) =>
    api(`/api/categories/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' }),
};
