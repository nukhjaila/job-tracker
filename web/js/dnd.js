// HTML5 Drag and Drop между колонками. Меняется только статус, порядок не сохраняется.

export function initDnd(boardEl, { onMove }) {
  let draggedId = null;
  let overColumn = null;

  function setOver(column) {
    if (overColumn === column) return;
    overColumn?.classList.remove('is-over');
    overColumn = column;
    overColumn?.classList.add('is-over');
  }

  function reset() {
    draggedId = null;
    setOver(null);
    boardEl.querySelectorAll('.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
  }

  boardEl.addEventListener('dragstart', (event) => {
    const card = event.target.closest?.('.card');
    if (!card) return;
    draggedId = card.dataset.id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
    requestAnimationFrame(() => card.classList.add('is-dragging'));
  });

  boardEl.addEventListener('dragend', reset);

  boardEl.addEventListener('dragover', (event) => {
    if (draggedId === null) return;
    const column = event.target.closest?.('.column');
    if (!column) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOver(column);
  });

  boardEl.addEventListener('dragleave', (event) => {
    const column = event.target.closest?.('.column');
    if (column && !column.contains(event.relatedTarget)) {
      if (overColumn === column) setOver(null);
    }
  });

  boardEl.addEventListener('drop', (event) => {
    if (draggedId === null) return;
    const column = event.target.closest?.('.column');
    if (!column) return;
    event.preventDefault();
    const id = draggedId;
    const status = column.dataset.status;
    reset();
    onMove(id, status);
  });
}