// Helper: normalize "YYYY-MM-DD HH:mm:ss" → Date object
function safeDate(str) {
  if (!str) return new Date();
  const normalized = str.replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d) ? new Date() : d;
}

function timeAgo(updated) {
  const updatedDate = (updated instanceof Date) ? updated : safeDate(updated);
  const now = new Date();
  const diffMs = now - updatedDate;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);

  let text = "";
  let cls = "";

  if (diffHr > 0) {
    text = `${diffHr} órával ezelőtt`;
    cls = "stale"; // piros
  } else if (diffMin > 5) {
    text = `${diffMin} perccel ezelőtt`;
    cls = "stale"; // piros
  } else if (diffMin > 1) {
    text = `${diffMin} perccel ezelőtt`;
    cls = "warn"; // narancs
  } else {
    text = `${diffSec} másodperccel ezelőtt`;
    cls = "fresh"; // zöld
  }

  return { text, cls };
}

async function loadSnapshot() {
  const tbody = document.getElementById("snapshot-table");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='4'>Betöltés…</td></tr>";

  try {
    const response = await fetch("../parking-status.json");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    addTimestampRow(tbody, "Snapshot", data);
    renderTable(data, tbody);
  } catch (err) {
    console.error("Snapshot fetch failed", err);
    tbody.innerHTML = "<tr><td colspan='4'>Snapshot fetch failed</td></tr>";
  }
}

async function loadLive() {
  const tbody = document.getElementById("live-table");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='4'>Betöltés…</td></tr>";

  try {
    const response = await fetch("http://localhost:3000/api/status");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    const rows = Array.isArray(data) ? data : data.data || [];
    addTimestampRow(tbody, "Live", rows);
    renderTable(rows, tbody);
  } catch (err) {
    console.error("Live fetch failed", err);
    tbody.innerHTML = "<tr><td colspan='4'>Live fetch failed</td></tr>";
  }
}

function renderTable(data, tbody) {
  if (!Array.isArray(data) || !data.length) {
    tbody.innerHTML += "<tr><td colspan='4'>Nincs elérhető adat</td></tr>";
    return;
  }

  data.sort((a, b) => b.free - a.free);

  const fragment = document.createDocumentFragment();

  data.forEach(r => {
    const percent = Math.round((r.free / r.total) * 100);
    const cls = percent < 20 ? "low" : percent < 50 ? "medium" : "high";

    const parsedDate = safeDate(r.updated);
    const ago = timeAgo(parsedDate);

    const tr = document.createElement("tr");
    tr.className = cls;
    tr.innerHTML = `
      <td>${r.label}</td>
      <td>
        <div class="bar">
          <div class="fill" style="width:${percent}%"></div>
        </div>
        ${r.free}
      </td>
      <td>${r.total}</td>
      <td>
        <time datetime="${parsedDate.toISOString()}" class="${ago.cls}">
          ${ago.text}
        </time>
      </td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

function addTimestampRow(tbody, label, data) {
  tbody.innerHTML = ""; 
  if (!data || !data.length) {
    const tr = document.createElement("tr");
    tr.className = "timestamp-row";
    tr.innerHTML = `<td colspan="4">${label} utolsó frissítés: nincs adat</td>`;
    tbody.appendChild(tr);
    return;
  }

  const latestDate = safeDate(data[0].updated);
  const humanReadable = latestDate.toLocaleString("hu-HU", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const ago = timeAgo(latestDate);

  const tr = document.createElement("tr");
  tr.className = "timestamp-row";
  tr.innerHTML = `
    <td colspan="4">
      <span class="${ago.cls}">
        ${label} utolsó frissítés: ${humanReadable}<br>
        (${ago.text})
      </span>
    </td>
  `;
  tbody.appendChild(tr);
}

window.onload = () => {
  loadSnapshot();
  loadLive();
  setInterval(loadLive, 30000);
};
