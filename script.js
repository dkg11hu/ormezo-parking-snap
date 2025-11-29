async function loadSnapshot() {
  const tbody = document.getElementById("snapshot-table");
  if (!tbody) {
    console.error("No element with id snapshot-table found");
    return;
  }
  tbody.innerHTML = "";

  try {
    const response = await fetch("../parking-status.json");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    console.log("Snapshot data:", data);
    renderTable(data, tbody);
  } catch (err) {
    console.error("Snapshot fetch failed", err);
    tbody.innerHTML = "<tr><td colspan='4'>Snapshot fetch failed</td></tr>";
  }
}

async function loadLive() {
  const tbody = document.getElementById("live-table");
  tbody.innerHTML = "";

  try {
    const response = await fetch("http://localhost:3000/api/status");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    console.log("Live data:", data);
    renderTable(data, tbody);
  } catch (err) {
    console.error("Live fetch failed", err);
    tbody.innerHTML = "<tr><td colspan='4'>Live fetch failed</td></tr>";
  }
}

function renderTable(data, tbody) {
  tbody.innerHTML = "";
  data.forEach(r => {
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${r.label}</td>
        <td>${r.free}</td>
        <td>${r.total}</td>
        <td>${r.updated}</td>
      </tr>
    `);
  });
}

window.onload = () => {
  loadSnapshot();
  document.getElementById("refresh-live").addEventListener("click", loadLive);
};
