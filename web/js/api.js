// Тонкий слой над fetch. Все запросы идут на относительный путь /api/applications.

export const STATUSES = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer', label: 'Offer' },
];

const BASE = '/api/applications';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const FALLBACK_MESSAGES = {
  400: 'Сервер отклонил данные. Проверьте поля формы.',
  404: 'Карточка не найдена. Возможно, её уже удалили.',
  500: 'Ошибка на сервере. Попробуйте ещё раз.',
};

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(BASE + path, options);
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте соединение.', 0);
  }

  if (!response.ok) {
    // Тело ошибки — обычный текст, а не JSON.
    let text = '';
    try {
      text = (await response.text()).trim();
    } catch {
      /* игнорируем */
    }
    const usable = text && text.length <= 200 && !text.startsWith('<');
    throw new ApiError(
      usable ? text : FALLBACK_MESSAGES[response.status] || `Ошибка ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

function jsonOptions(method, payload) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export function listApplications() {
  return request('');
}

export function createApplication(data) {
  return request('', jsonOptions('POST', {
    company: data.company,
    position: data.position,
    url: data.url ?? '',
    status: data.status,
    interview_date: data.interview_date ?? null,
    notes: data.notes ?? '',
  }));
}

// PUT — полная замена: всегда отправляем все редактируемые поля.
// id, created_at и updated_at в тело не попадают.
export function updateApplication(id, data) {
  return request(`/${encodeURIComponent(id)}`, jsonOptions('PUT', {
    company: data.company,
    position: data.position,
    url: data.url ?? '',
    status: data.status,
    interview_date: data.interview_date ?? null,
    notes: data.notes ?? '',
    position_in_column: data.position_in_column ?? 0,
  }));
}

export function updateStatus(id, status) {
  return request(`/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', { status }));
}

export function deleteApplication(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}