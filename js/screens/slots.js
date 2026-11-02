import { listSlots, deleteSlot, slotName, setSlotName } from '../systems/save.js';

import { ANIMALS } from '../data/animals.js';

const ANIMAL_TOTAL = ANIMALS.length;

function card(n, data, onPick, onDelete, onRename) {
  const name = slotName(n).replace(/[&<>"]/g, '');
  const el = document.createElement('div');
  el.className = 'slot-card' + (data ? '' : ' empty');
  if (data) {
    const found = Object.keys(data.discovered || {}).length;
    el.innerHTML = `<div class="slot-title">${name}</div>
      <div class="slot-info">$${data.money.toLocaleString()} · ${found}/${ANIMAL_TOTAL} animals</div>
      <div class="slot-date">${new Date(data.lastPlayed).toLocaleDateString()}</div>
      <button class="slot-del" aria-label="Delete ${name}">✕</button>
      <button class="slot-edit" aria-label="Rename ${name}">✎</button>`;
    el.querySelector('.slot-del').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete ${name}? This cannot be undone.`)) onDelete();
    });
  } else {
    el.innerHTML = `<div class="slot-title">${name}</div><div class="slot-info">New Farm</div>
      <button class="slot-edit" aria-label="Rename ${name}">✎</button>`;
  }
  el.querySelector('.slot-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    const v = prompt('Farm name:', name);
    if (v !== null) { setSlotName(n, v); onRename(); }
  });
  el.addEventListener('click', () => onPick(n));
  return el;
}

export function renderSlots(container, onPick) {
  const list = container.querySelector('#slot-list');
  const draw = () => {
    list.replaceChildren(...listSlots().map((d, i) =>
      card(i + 1, d, onPick, () => { deleteSlot(i + 1); draw(); }, draw)));
  };
  draw();
}
