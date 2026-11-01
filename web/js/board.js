// Доска: загрузка, отрисовка, поиск, удаление, перенос статуса.

import { STATUSES, listApplications, updateStatus, deleteApplication } from './api.js';
import { initDnd } from './dnd.js';
import { initForm, openForm } from './form.js';
import { safeUrl, formatDateTime, showToast } from './utils.js';

const boardEl = document.getElementById('board');
const stateEl = document.getElementById('state');
const searchEl = document.getElementById('search');
const addBtn = document.getElementById('add-btn');

let items = [];
let loaded = false;
const pendingMoves = new Set();
const deleting = new Set();
const columns = {};

function isBusy(id) {
  const key = String(id);
  return pendingMoves.has(key) || deleting.has(key);
}

const findItem = (id) => items.find((i) => String(i.id) === String(id));

// ---------- Колонки ----------

function buildColumns() {
  for (const { value, label } of STATUSES) {
    const section = document.createElement('section');
    section.className = 'column';
    section.dataset.status = value;
    section.setAttribute('aria-labelledby', `col-${value}`);

    const header = document.createElement('header');
    header.className = 'column-header';

    const title = document.createElement('h2');
    title.id = `col-${value}`;
    title.textContent = label;

    const count = document.createElement('span');
    count.className = 'count';

    header.append(title, count);

    const list = document.createElement('ul');
    list.className = 'cards';

    section.append(header, list);
    boardEl.append(section);
    columns[value] = { list, count };
  }
}

// ---------- Карточки ----------

function createCard(item) {
  const li = document.createElement('li');
  li.className = 'card';
  li.dataset.id = item.id;
  const busy = isBusy(item.id);

  li.draggable = !busy;
  if (busy) li.classList.add('is-pending');

  const company = document.createElement('h3');
  company.className = 'card-company';
  company.textContent = item.company;

  const position = document.createElement('p');
  position.className = 'card-position';
  position.textContent = item.position;

  li.append(company, position);

  const href = safeUrl(item.url);
  if (href) {
    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.draggable = false;
    link.textContent = new URL(href).hostname + ' ↗';
    li.append(link);
  }

  if (item.interview_date) {
    const when = formatDateTime(item.interview_date);
    if (when) {
      const date = document.createElement('p');
      date.className = 'card-date';
      const time = document.createElement('time');
      time.dateTime = item.interview_date;
      time.textContent = when;
      date.append('Собеседование: ', time);
      li.append(date);
    }
  }

  if (item.notes) {
    const notes = document.createElement('p');
    notes.className = 'card-notes';
    notes.textContent = item.notes;
    li.append(notes);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'btn btn-small js-edit';
  edit.textContent = 'Изменить';
  edit.setAttribute('aria-label', `Изменить: ${item.company}, ${item.position}`);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn btn-small btn-danger js-delete';
  del.textContent = 'Удалить';
  del.setAttribute('aria-label', `Удалить: ${item.company}, ${item.position}`);

  edit.disabled = busy;
  del.disabled = busy;

  actions.append(edit, del);
  li.append(actions);
  return li;
}

function sortItems(a, b) {
  return (a.position_in_column ?? 0) - (b.position_in_column ?? 0) || Number(a.id) - Number(b.id);
}

function render() {
  if (!loaded) return;

  if (items.length === 0) {
    boardEl.hidden = true;
    showState({
      title: 'Пока нет откликов',
      text: 'Добавьте первую вакансию или стажировку.',
      actionLabel: 'Добавить отклик',
      onAction: () => openForm({ trigger: addBtn }),
    });
    return;
  }

  boardEl.hidden = false;
  const query = searchEl.value.trim().toLowerCase();
  const visible = query
    ? items.filter(
        (i) =>
          String(i.company ?? '').toLowerCase().includes(query) ||
          String(i.position ?? '').toLowerCase().includes(query),
      )
    : items;

  for (const { value } of STATUSES) {
    const cards = visible.filter((i) => i.status === value).sort(sortItems);
    const { list, count } = columns[value];
    count.textContent = String(cards.length);
    count.setAttribute('aria-label', `Карточек: ${cards.length}`);

    if (cards.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = query ? 'Нет совпадений' : 'Пусто';
      list.replaceChildren(empty);
    } else {
      list.replaceChildren(...cards.map(createCard));
    }
  }

  if (query && visible.length === 0) {
    showState({
      title: 'Ничего не найдено',
      text: 'Измените запрос или сбросьте поиск.',
      actionLabel: 'Сбросить поиск',
      onAction: () => {
        searchEl.value = '';
        render();
        searchEl.focus();
      },
    });
  } else {
    hideState();
  }
}

// ---------- Состояния ----------

function showState({ title, text, actionLabel, onAction, loading = false, error = false }) {
  stateEl.replaceChildren();
  stateEl.hidden = false;
  stateEl.className = 'state' + (error ? ' is-error' : '');
  stateEl.setAttribute('role', error ? 'alert' : 'status');

  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    stateEl.append(spinner);
  }

  const heading = document.createElement('p');
  heading.className = 'state-title';
  heading.textContent = title;
  stateEl.append(heading);

  if (text) {
    const body = document.createElement('p');
    body.className = 'state-text';
    body.textContent = text;
    stateEl.append(body);
  }

  if (actionLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = actionLabel;
    button.addEventListener('click', onAction);
    stateEl.append(button);
  }
}

function hideState() {
  stateEl.hidden = true;
  stateEl.replaceChildren();
}

// ---------- Загрузка ----------

async function load({ silent = false } = {}) {
  if (!silent) {
    boardEl.hidden = true;
    addBtn.disabled = true;
    showState({ title: 'Загружаю отклики…', loading: true });
  }

  try {
    const data = await listApplications();
    items = Array.isArray(data) ? data : [];
    loaded = true;
    addBtn.disabled = false;
    render();
  } catch (error) {
    if (silent) return;
    loaded = false;
    boardEl.hidden = true;
    showState({
      title: 'Не удалось загрузить доску',
      text: error.message,
      actionLabel: 'Повторить',
      onAction: () => load(),
      error: true,
    });
  }
}

// ---------- Форма ----------

function handleSaved(saved, wasEditing) {
  const index = items.findIndex((i) => String(i.id) === String(saved.id));
  if (index >= 0) items[index] = saved;
  else items.push(saved);
  render();
  showToast(wasEditing ? 'Изменения сохранены.' : 'Отклик добавлен.');
}

// ---------- Удаление ----------
function confirmDelete(item) {
  const dialog = document.getElementById('delete-dialog');
  const description = document.getElementById('delete-description');

  // Не открываем несколько подтверждений одновременно.
  if (dialog.open) return Promise.resolve(false);

  const opener = document.activeElement;

  description.textContent =
    `«${item.company} — ${item.position}». Это действие нельзя отменить.`;

  dialog.returnValue = '';

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }

      resolve(dialog.returnValue === 'delete');
    }, { once: true });

    dialog.showModal();
    document.getElementById('delete-cancel').focus();
  });
}

async function removeItem(id) {
  const item = findItem(id);
  const key = String(id);

  if (!item || isBusy(id)) return;

  const confirmed = await confirmDelete(item);
  if (!confirmed) return;

  if (!findItem(id) || isBusy(id)) return;

  deleting.add(key);
  render();

  try {
    await deleteApplication(item.id);

    items = items.filter((i) => String(i.id) !== key);
    showToast('Отклик удалён.');
  } catch (error) {
    if (error.status === 404) {
      items = items.filter((i) => String(i.id) !== key);
      showToast('Карточка уже удалена. Она убрана с доски.');
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    deleting.delete(key);
    render();
    boardEl.focus({ preventScroll: true });
  }
}
// ---------- Перенос ----------

async function moveItem(id, status) {
  const item = findItem(id);
  const key = String(id);

  if (
    !item ||
    item.status === status ||
    isBusy(id) ||
    !STATUSES.some((s) => s.value === status)
  ) {
    return;
  }

  const previous = item.status;

  pendingMoves.add(key);
  item.status = status;
  render();

  try {
    await updateStatus(item.id, status);

    const label = STATUSES.find((s) => s.value === status).label;
    showToast(`Перенесено в «${label}».`);
  } catch (error) {
    if (error.status === 404) {
      items = items.filter((i) => String(i.id) !== key);
      showToast('Карточка уже удалена. Она убрана с доски.', 'error');
    } else {
      item.status = previous;
      showToast(
        `Не удалось перенести карточку: ${error.message}`,
        'error',
      );
    }
  } finally {
    pendingMoves.delete(key);
    render();
  }
}

// ---------- Инициализация ----------

buildColumns();
initForm(handleSaved);
initDnd(boardEl, { onMove: moveItem });

addBtn.addEventListener('click', () => openForm({ trigger: addBtn }));
searchEl.addEventListener('input', render);

boardEl.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const card = button.closest('.card');
  if (!card) return;

  if (isBusy(card.dataset.id)) return;

  if (button.classList.contains('js-edit')) {
    const item = findItem(card.dataset.id);
    if (item) openForm({ card: item, trigger: button });
  } else if (button.classList.contains('js-delete')) {
    removeItem(card.dataset.id);
  }
});

load();