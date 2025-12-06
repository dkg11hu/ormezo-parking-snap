// public/app.js

function renderCard(lot) {
  return `
    <div class="card">
      <h3 class="card-title">${lot.name}</h3>
      <p class="card-free">Szabad helyek: ${lot.free}</p>
      <p class="card-total">Összes hely: ${lot.total}</p>
      <p class="card-updated">Frissítve: ${lot.updated}</p>
      <a class="card-link" href="${lot.url}" target="_blank">Megnyitás</a>
    </div>
  `;
}

function render(data) {
  const container = document.getElementById("cards");
  container.innerHTML = data.map(renderCard).join("");
}

// Statikus JSON (Pages):
// fetch("parking-status.json")

// Render API (valós idejű):
fetch("https://ormezo-parking.onrender.com/api/parking-status")
  .then(r => r.json())
  .then(data => render(data))
  .catch(err => {
    document.getElementById("cards").innerHTML =
      "<p class='error'>Hiba történt: " + err.message + "</p>";
  });
