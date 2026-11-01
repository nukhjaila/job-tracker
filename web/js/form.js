// Одна форма для создания и редактирования карточки (элемент <dialog>).

import { STATUSES, createApplication, updateApplication } from './api.js';
import { safeUrl, toLocalInputValue, fromLocalInputValue } from './utils.js';

const dialog = document.getElementById('form-dialog');
const form = document.getElementById('app-form');
const titleEl = document.getElementById('form-title');
const errorEl = document.getElementById('form-error');
const submitBtn = document.getElementById('form-submit');
const cancelBtn = document.getElementById('form-cancel');
const closeBtn = document.getElementById('form-close');
const addBtn = document.getElementById('add-btn');

const fields = {
  company: form.elements.company,
  position: form.elements.position,
  url: form.elements.url,
  status: form.elements.status,
  interview_date: form.elements.interview_date,
  notes: form.elements.notes,
};

let editing = null;
let trigger = null;
let returnId = null;
let submitting = false;
let onSaved = () => {};

export function initForm(savedCallback) {
  onSaved = savedCallback;

  for (const s of STATUSES) {
    const option = document.createElement('option');
    option.value = s.value;
    option.textContent = s.label;
    fields.status.append(option);
  }

  form.addEventListener('submit', handleSubmit);
  cancelBtn.addEventListener('click', requestClose);
  closeBtn.addEventListener('click', requestClose);

  // Escape: не закрываем, пока идёт запрос.
  dialog.addEventListener('cancel', (event) => {
    if (submitting) event.preventDefault();
  });

  // Возврат фокуса после закрытия.
  dialog.addEventListener('close', () => {
    const card = returnId
      ? document.querySelector(`.card[data-id="${CSS.escape(String(returnId))}"] .js-edit`)
      : null;
    const target = card || (trigger && trigger.isConnected ? trigger : addBtn);
    target.focus();
    editing = null;
    returnId = null;
    trigger = null;
  });
}

export function openForm({ card = null, status = 'wishlist', trigger: opener = null } = {}) {
  editing = card;
  returnId = card ? card.id : null;
  trigger = opener;

  titleEl.textContent = card ? 'Редактировать отклик' : 'Новый отклик';
  submitBtn.textContent = 'Сохранить';

  fields.company.value = card?.company ?? '';
  fields.position.value = card?.position ?? '';
  fields.url.value = card?.url ?? '';
  fields.status.value = card?.status ?? status;
  fields.interview_date.value = toLocalInputValue(card?.interview_date);
  fields.notes.value = card?.notes ?? '';

  hideError();
  setSubmitting(false);
  dialog.showModal();
  fields.company.focus();
}

function requestClose() {
  if (!submitting) dialog.close();
}

function setSubmitting(value) {
  submitting = value;
  submitBtn.disabled = value;
  closeBtn.disabled = value;
  cancelBtn.disabled = value;
  submitBtn.textContent = value ? 'Сохраняю…' : 'Сохранить';
  form.setAttribute('aria-busy', String(value));
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.textContent = '';
  errorEl.hidden = true;
}

function validate(data) {
  if (!data.company) return { message: 'Укажите компанию.', field: fields.company };
  if (!data.position) return { message: 'Укажите должность.', field: fields.position };
  if (data.url && !safeUrl(data.url)) {
    return { message: 'Ссылка должна начинаться с http:// или https://', field: fields.url };
  }
  if (fields.interview_date.value && !data.interview_date) {
    return { message: 'Некорректная дата собеседования.', field: fields.interview_date };
  }
  return null;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;

  const data = {
    company: fields.company.value.trim(),
    position: fields.position.value.trim(),
    url: fields.url.value.trim(),
    status: fields.status.value,
    interview_date: fromLocalInputValue(fields.interview_date.value),
    notes: fields.notes.value.trim(),
  };

  const problem = validate(data);
  if (problem) {
    showError(problem.message);
    problem.field.focus();
    return;
  }

  hideError();
  setSubmitting(true);
  try {
    const wasEditing = Boolean(editing);
    const saved = wasEditing
      ? await updateApplication(editing.id, {
          ...data,
          position_in_column: editing.position_in_column ?? 0,
        })
      : await createApplication(data);

    // Сначала обновляем доску, затем закрываем — чтобы фокус вернулся на новый элемент.
    onSaved(saved, wasEditing);
    setSubmitting(false);
    dialog.close();
  } catch (error) {
    // Введённые значения остаются в полях.
    showError(error.message);
    setSubmitting(false);
  }
}