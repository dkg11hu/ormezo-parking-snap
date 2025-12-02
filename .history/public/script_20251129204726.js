// public/script.js
(async function () {
  const SNAP_URL = '/snapshot';
  const LIVE_URL = '/live';
  const REFRESH_MS = 30_000; // 30s
  const STALE_MS = 5 * 60_000; // 5 minutes = stale
  const WARN_MS = 2 * 60_000; // 2 minutes = warn

  function el(id) { return document.getElementById(id); }

  function fmtTime(iso) {
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }

  function ageMs(iso) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return Infinity;
    return Date.now() - t;
  }

  function statusClassForAge(ms) {
    if (ms === Infinity) return 'stale';
    if (ms <= WARN_MS) return 'fresh';
    if (ms <= STALE_MS) return 'warn';
    return 'stale';
  }

  function createRow(item) {
    // item: { name, free, total, updated }  (adjust keys to your API)
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = item.name || item.id || '—';
    tr.appendChild(nameTd);

    const freeTd = document.createElement('td');
    freeTd.textContent = (item.free == null) ? '—' : String(item.free);
    tr.appendChild(freeTd);

    const totalTd = document.createElement('td');
    totalTd.textContent = (item.total == null) ? '—' : String(item.total);
    tr.appendChild(totalTd);

    const updatedTd = document.createElement('td');
    const updatedIso = item.updated || item.timestamp || item.time || null;
    const ms = updatedIso ? ageMs(updatedIso) : Infinity;
    const cls = statusClassForAge(ms);
    const timeEl = document.createElement('time');
    timeEl.className = cls;
    timeEl.dateTime = updatedIso || '';
    timeEl.textContent = updatedIso ? fmtTime(updatedIso) : '—';
    updatedTd.appendChild(timeEl);
    tr.appendChild(updatedTd);

    // optional: occupancy bar row appended after this row
    const barTr = document.createElement('tr');
    const barTd = document.createElement('td');
    barTd.colSpan = 4;
    const bar = document.createElement('div');
    bar.className = 'bar ' + (item.total ? '' : 'no-total');
    const fill = document.createElement('div');
    fill.className = 'fill';
    if (item.total && item.total > 0 && item.free != null) {
      const used = Math.max(0, item.total - item.free);
      const pct = Math.min(100, Math.round((used / item.total) * 100));
      fill.style.width = pct + '%';
      // color by free ratio
      const freeRatio = item.free / item.total;
      if (freeRatio <= 0.1) fill.classList.add('low');
      else if (freeRatio <= 0.3) fill.classList.add('medium');
      else fill.classList.add('high');
    } else {
      fill.style.width = '0%';
      fill.classList.add('low');
    }
    bar.appendChild(fill);
    barTd.appendChild(bar);
    barTr.appendChild(barTd);

    return [tr, barTr];
  }

  function clearAndRender(containerId, items) {
    const container = el(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(items)) return;
    for (const it of items) {
      const [row, barRow] = createRow(it);
      container.appendChild(row);
      container.appendChild(barRow);
    }
  }

  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('fetch error', url, err);
      return null;
    }
  }

  async function refresh() {
    // snapshot first (less frequent source), then live
    const [snapshot, live] = await Promise.all([fetchJson(SNAP_URL), fetchJson(LIVE_URL)]);
    if (snapshot) {
      // expect snapshot to be an array or { items: [...] }
      const sItems = Array.isArray(snapshot) ? snapshot : (snapshot.items || snapshot.data || []);
      clearAndRender('snapshot-table', sItems);
    }
    if (live) {
      const lItems = Array.isArray(live) ? live : (live.items || live.data || []);
      clearAndRender('live-table', lItems);
    }
  }

  // initial load + periodic refresh
  await refresh();
  setInterval(refresh, REFRESH_MS);

  // expose manual refresh for debugging
  window.__refreshParking = refresh;
})();
