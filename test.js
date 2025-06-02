
const fieldsToFilter = [
  "Genre", "Orientation Sexuelle", "Niveau de Santé", "Situation Financière",
  "Orientation politique", "Handicap visible", "Non Fumeur", "Niveau sonore",
  "Antécédants financiers", "Religion", "Poids", "Propreté", "Goûts musicaux", "Régime alimentaire"
];

let allData = [];
let favoriteIds = [];

function createCheckboxFilters(data) {
  const filtersDiv = document.getElementById('filters');

  // 📦 Créer les autres filtres par champ
  fieldsToFilter.forEach(field => {
    const container = document.createElement('details');
    container.className = 'filter-group';

    const summary = document.createElement('summary');
    summary.textContent = field;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'filter-options';

    let options = [];
    if (field === "Goûts musicaux") {
      const genreSet = new Set();
      data.forEach(d => {
        if (d[field]) {
          d[field].split(',').map(v => v.trim()).forEach(g => genreSet.add(g));
        }
      });
      options = [...genreSet];
    } else {
      options = [...new Set(data.map(d => d[field]).filter(Boolean))];
    }

    options.forEach(opt => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" data-field="${field}" value="${opt}"> ${opt}`;
      optionsDiv.appendChild(label);
    });

    container.appendChild(summary);
    container.appendChild(optionsDiv);
    filtersDiv.appendChild(container);
  });

  // 💖 Ajouter filtre "Favoris uniquement"
  const favFilter = document.createElement('label');
  favFilter.style.marginTop = "30px";
  favFilter.innerHTML = `
    <input type="checkbox" id="fav-filter" /> ❤️ Favoris
  `;
  filtersDiv.appendChild(favFilter);
  document.getElementById('fav-filter').addEventListener('change', applyFilters);

  document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const selected = {};

  document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => {
    const field = cb.dataset.field;
    if (!field) return;
    if (!selected[field]) selected[field] = [];
    if (cb.checked) selected[field].push(cb.value);
  });

  const favOnly = document.getElementById('fav-filter')?.checked;

  const filtered = allData.filter(item => {
    if (favOnly && !favoriteIds.includes(item.id)) return false;

    return Object.entries(selected).every(([key, values]) => {
      if (values.length === 0) return true;
      const itemValue = item[key];
      if (!itemValue) return false;

      if (key === "Goûts musicaux") {
        const genres = itemValue.split(',').map(v => v.trim());
        return values.some(v => genres.includes(v));
      } else {
        return values.includes(itemValue);
      }
    });
  });

  renderCards(filtered);
  updateActiveFilters(selected);
}

function updateActiveFilters(selected) {
  const container = document.getElementById('active-filters');
  container.innerHTML = '';

  Object.entries(selected).forEach(([field, values]) => {
    values.forEach(value => {
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.innerHTML = `${field}: ${value} <span class="remove" data-field="${field}" data-value="${value}">&times;</span>`;
      container.appendChild(tag);
    });
  });

  container.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const { field, value } = btn.dataset;
      const checkbox = document.querySelector(`input[data-field="${field}"][value="${value}"]`);
      if (checkbox) checkbox.checked = false;
      if (field === "undefined") return;

      applyFilters();
    });
  });
}

function renderCards(data) {
  const container = document.querySelector('#cards-container .cards-inner');
  container.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    const isFav = favoriteIds.includes(item.id);
    const heart = isFav ? '❤️' : '🤍';

    card.innerHTML = `
      <img src="${item.Photo}" alt="Avatar" />
      <div class="info">
        <h2>${item.Prénom} ${item.Nom}</h2>
        <p>${item.Description}</p>
        <p><strong>Genre:</strong> ${item.Genre}</p>
        <p><strong>Santé:</strong> ${item["Niveau de Santé"]}</p>
        <p><strong>Fumeur:</strong> ${item["Non Fumeur"]}</p>
        <p><strong>Goûts musicaux:</strong> ${item["Goûts musicaux"]}</p>
        <div class="favorite-icon" data-id="${item.id}" title="Ajouter aux favoris">${heart}</div>
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('.favorite-icon').forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation(); // évite tout effet de bord
    const id = icon.dataset.id;

    if (favoriteIds.includes(id)) {
      favoriteIds = favoriteIds.filter(f => f !== id);
    } else {
      favoriteIds.push(id);
    }

    // Mettre à jour le cœur visuellement sans relancer tout le filtre
    icon.textContent = favoriteIds.includes(id) ? '❤️' : '🤍';

    // Sauvegarder l'état sans redessiner toute la page
    localStorage.setItem('favorites', JSON.stringify(favoriteIds));
  });
});
}

Papa.parse("profils.csv", {
  header: true,
  download: true,
  complete: function(results) {
    allData = results.data
      .filter(d => d.Nom)
      .map(d => {
        d.id = d.Nom + "_" + d.Prénom;
        return d;
      });
    favoriteIds = JSON.parse(localStorage.getItem("favorites") || "[]");

    createCheckboxFilters(allData);
    applyFilters();
  }
});

