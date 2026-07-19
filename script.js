const eventGrid = document.querySelector('#event-grid');
const eventCount = document.querySelector('#event-count');
const categoryCount = document.querySelector('#category-count');
const nasaStatus = document.querySelector('#nasa-status');
const nasaStatusDot = document.querySelector('#nasa-status-dot');

const categoryTone = (name = '') => {
  const value = name.toLowerCase();
  if (value.includes('wildfire')) return 'fire';
  if (value.includes('storm') || value.includes('flood')) return 'water';
  if (value.includes('volcano') || value.includes('earthquake')) return 'earth';
  return 'climate';
};

const formatDate = (value) => {
  if (!value) return 'Latest update';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};

const escapeText = (value = '') => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

async function loadClimateEvents() {
  try {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=8');
    if (!response.ok) throw new Error('NASA feed unavailable');
    const payload = await response.json();
    const events = Array.isArray(payload.events) ? payload.events.slice(0, 8) : [];
    const categories = new Set(events.flatMap((event) => event.categories.map((category) => category.title)));

    eventCount.textContent = events.length;
    categoryCount.textContent = categories.size;
    nasaStatus.textContent = `Live · refreshed ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    nasaStatusDot.className = 'live';

    eventGrid.innerHTML = events.map((event) => {
      const category = event.categories?.[0]?.title || 'Natural event';
      const geometry = event.geometry?.[event.geometry.length - 1];
      const coordinates = geometry?.coordinates;
      const location = coordinates?.length >= 2 ? `${Number(coordinates[1]).toFixed(1)}°, ${Number(coordinates[0]).toFixed(1)}°` : 'Global report';
      const url = event.sources?.[0]?.url || event.link || 'https://eonet.gsfc.nasa.gov/';
      return `<a class="event-card" href="${escapeText(url)}" target="_blank" rel="noreferrer">
        <div class="event-top"><i class="${categoryTone(category)}"></i><span>${escapeText(category)}</span><b>Active</b></div>
        <h3>${escapeText(event.title)}</h3>
        <div class="event-meta"><span>${formatDate(geometry?.date)}</span><span>${location}</span></div>
      </a>`;
    }).join('');
    eventGrid.setAttribute('aria-busy', 'false');
  } catch (error) {
    eventCount.textContent = '—';
    categoryCount.textContent = '—';
    nasaStatus.textContent = 'Feed temporarily unavailable';
    nasaStatusDot.className = 'offline';
    eventGrid.innerHTML = '<div class="feed-message"><strong>The live feed could not be reached.</strong><span>Use NASA EONET directly for the latest active natural events.</span></div>';
    eventGrid.setAttribute('aria-busy', 'false');
  }
}

loadClimateEvents();
