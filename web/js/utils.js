// Небольшие помощники: ссылки, даты, уведомления.

// Разрешаем только http и https.
export function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// ISO-строка -> значение для <input type="datetime-local"> в ЛОКАЛЬНОМ часовом поясе.
export function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Значение datetime-local (локальное время) -> RFC3339 (UTC), пустое -> null.
export function fromLocalInputValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
}

// Уведомления. Текст всегда через textContent.
export function showToast(message, type = 'success') {
  const container = document.getElementById('toasts');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  if (type === 'error') toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), type === 'error' ? 6000 : 3500);
}