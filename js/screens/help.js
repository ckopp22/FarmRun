import { tapSound } from '../systems/audio.js';

const CONTACT_EMAIL = 'koppstudioapps@outlook.com';
const SHARE_URL = 'https://ckopp22.github.io/FarmRun/';

const helpEl = document.getElementById('help');
const titleEl = document.getElementById('help-title');
const bodyEl = document.getElementById('help-body');
const backEl = document.getElementById('help-back');
let page = null;   // null = the list of options

const PAGES = {
  how: {
    title: 'How to Play',
    html: `<p>Run into the woods, catch animals, and bring them back to the farm.</p>
      <ul>
        <li><b>Move:</b> touch and drag anywhere on the screen to steer your farmer.</li>
        <li><b>Catch:</b> walk up to an animal to put it on a leash. Your bag only holds so many, so watch the 🎒 counter.</li>
        <li><b>Rivals:</b> other farmers are hunting the same animals. If one catches you, you lose your haul.</li>
        <li><b>Escape:</b> walk back to your truck to bank your animals and drive home.</li>
        <li><b>Sell:</b> tap an animal's pen on the farm to sell it. You can sell common animals once you have 5. Every other animal sells once you have 2, and one always stays in its pen.</li>
        <li><b>Upgrade:</b> spend your money in the 🛒 Shop on bigger bags, faster shoes, and new animal pens.</li>
        <li><b>Rarity:</b> uncommon animals walk away from you; rare, epic, and legendary animals run, and the rarer they are, the faster they go.</li>
      </ul>
      <p><b>Beat the game:</b> become a millionaire by earning $1,000,000!</p>`,
  },
  legal: {
    title: 'Legal',
    html: `<h3>Privacy</h3>
      <p>Farm Run 3D does not collect, track, or share any personal information. Your farms, settings, and progress are saved only on your own device and are never sent anywhere.</p>
      <h3>Terms of Use</h3>
      <p>Farm Run 3D is provided free of charge and "as is", without warranties of any kind. Progress is stored in your browser, so clearing your site data will erase it. By playing you agree to use the game for personal, non-commercial enjoyment.</p>
      <h3>Credits</h3>
      <p>Built with three.js. Music and sound effects are used with permission of their creators.</p>`,
  },
};

function render() {
  bodyEl.innerHTML = '';
  if (page) {
    titleEl.textContent = PAGES[page].title;
    bodyEl.innerHTML = PAGES[page].html;
    backEl.textContent = 'Back';
    return;
  }
  titleEl.textContent = 'Help';
  backEl.textContent = 'Close';
  for (const [id, label] of [['how', '📖 How to Play'], ['legal', '📄 Legal'], ['contact', '✉️ Contact Us'], ['share', '📤 Share']]) {
    const b = document.createElement('button');
    b.className = 'help-item';
    b.textContent = label;
    b.addEventListener('click', () => choose(id));
    bodyEl.appendChild(b);
  }
}

async function share() {
  const data = { title: 'Farm Run 3D', text: 'Catch animals, dodge rival farmers, and build your farm!', url: SHARE_URL };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(SHARE_URL); toast('Link copied!'); }
  } catch (e) { /* share cancelled */ }
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'help-toast';
  t.textContent = msg;
  helpEl.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

function choose(id) {
  tapSound();
  if (id === 'contact') { window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Farm Run 3D')}`; return; }
  if (id === 'share') { share(); return; }
  page = id;
  render();
}

export function initHelp() {
  document.getElementById('help-btn').addEventListener('click', () => { tapSound(); page = null; render(); helpEl.style.display = ''; });
  backEl.addEventListener('click', () => {
    tapSound();
    if (page) { page = null; render(); } else helpEl.style.display = 'none';
  });
}
