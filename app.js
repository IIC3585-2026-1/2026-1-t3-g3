const PRODUCTS = [
  { id: 1, name: 'Leche', price: 3000, benefit: 6, stock: 1 },
  { id: 2, name: 'Pan', price: 2000, benefit: 4, stock: 1 },
  { id: 3, name: 'Huevos', price: 3500, benefit: 7, stock: 1 },
  { id: 4, name: 'Arroz', price: 2500, benefit: 5, stock: 1 },
  { id: 5, name: 'Pollo', price: 5000, benefit: 10, stock: 1 },
  { id: 6, name: 'Fruta', price: 2000, benefit: 5, stock: 1 },
  { id: 7, name: 'Fideos', price: 2200, benefit: 5, stock: 1 },
  { id: 8, name: 'Atun', price: 3200, benefit: 6, stock: 1 }
];

const images =[
  { id: 1, name: 'Leche', image: 'images/leche.png' },
  { id: 2, name: 'Pan', image: 'images/pan.png' },
  { id: 3, name: 'Huevos', image: 'images/huevo.jpg' },
  { id: 4, name: 'Arroz', image: 'images/arroz.jpg' },
  { id: 5, name: 'Pollo', image: 'images/pollo.jpg' },
  { id: 6, name: 'Fruta', image: 'images/fruta.jpeg' },
  { id: 7, name: 'Fideos', image: 'images/fideos.jpg' },
  { id: 8, name: 'Atun', image: 'images/atun.jpeg' },
]

let knapsack = null;

document.addEventListener('click', function (e) {
  const card = e.target.closest('.product-card');
  if (!card) return;

  const checkbox = card.querySelector('input[type="checkbox"]');
  if (e.target !== checkbox) {
    checkbox.checked = !checkbox.checked;
    card.classList.toggle('selected', checkbox.checked);
  }
});

function clp(n) {
  return '$' + n.toLocaleString('es-CL');
}

function sum(items, key) {
  return items.reduce(function (acc, item) {
    return acc + item[key];
  }, 0);
}

function toCsv(items, key) {
  return items.map(function (item) {
    return item[key];
  }).join(',');
}

function wasmBestValue(items, capacity, cache) {
  if (items.length === 0 || capacity <= 0) {
    return 0;
  }

  const key = items.map(function (item) {
    return item.id;
  }).join('-') + '|' + capacity;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const value = knapsack(toCsv(items, 'price'), toCsv(items, 'benefit'), capacity);
  if (value < 0) {
    cache.set(key, 0);
    return 0;
  }

  cache.set(key, value);
  return value;
}

function pickOptionalProducts(items, capacity, cache) {
  if (items.length === 0 || capacity <= 0) {
    return [];
  }

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);

  if (last.price > capacity) {
    return pickOptionalProducts(rest, capacity, cache);
  }

  const withoutLast = wasmBestValue(rest, capacity, cache);
  const withLast = last.benefit + wasmBestValue(rest, capacity - last.price, cache);

  if (withLast > withoutLast) {
    return pickOptionalProducts(rest, capacity - last.price, cache).concat(last);
  }

  return pickOptionalProducts(rest, capacity, cache);
}

function applyStockFromInputs() {
  let updated = 0;
  PRODUCTS.forEach(function (p) {
    const input = document.querySelector(`input[data-stock-id="${p.id}"]`);
    if (!input) return;
    const qty = parseInt(input.value, 10);
    const safeQty = Number.isNaN(qty) || qty < 0 ? 0 : qty;
    p.stock = safeQty;
    updated += 1;
  });
  return updated;
}

function updateStockStatus() {
  const stockStatus = document.getElementById('stock-status');
  const updated = applyStockFromInputs();
  stockStatus.textContent = `Stock actualizado: ${updated} productos.`;
}

function applyBenefitsFromInputs() {
  let updated = 0;
  PRODUCTS.forEach(function (p) {
    const input = document.querySelector(`input[data-benefit-id="${p.id}"]`);
    if (!input) return;
    const benefit = parseInt(input.value, 10);
    const safeBenefit = Number.isNaN(benefit) || benefit < 0 ? 0 : benefit;
    p.benefit = safeBenefit;
    updated += 1;
  });
  return updated;
}

function updateBenefitStatus() {
  const benefitStatus = document.getElementById('benefit-status');
  const updated = applyBenefitsFromInputs();
  benefitStatus.textContent = `Beneficios actualizados: ${updated} productos.`;
}

function expandByStock(items) {
  const expanded = [];
  items.forEach(function (item) {
    const stock = Math.max(0, item.stock || 0);
    for (let i = 0; i < stock; i += 1) {
      expanded.push({
        id: item.id + '-' + i,
        productId: item.id,
        name: item.name,
        price: item.price,
        benefit: item.benefit
      });
    }
  });
  return expanded;
}

function renderProducts() {
  const node = document.getElementById('products');

  node.innerHTML = PRODUCTS.map(function (p) {
    const img = images.find(image => image.name === p.name)?.image || "img/default.png";

    return `
      <div class="product-card">

        <img src="${img}" alt="${p.name}">

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">${clp(p.price)}</p>
        </div>

        <label class="product-select">
          <input type="checkbox" data-id="${p.id}">
          <span>Obligatorio</span>
        </label>

      </div>
    `;
  }).join('');
}

function getMandatoryProducts() {
  return PRODUCTS.filter(function (p) {
    const checkbox = document.querySelector(`input[data-id="${p.id}"]`);
    return checkbox && checkbox.checked;
  });
}

function countByName(items) {
  const map = new Map();
  items.forEach(function (item) {
    const key = item.name;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries());
}

function calculatePlan(budget) {
  const mandatory = getMandatoryProducts();
  const mandatoryCost = sum(mandatory, 'price');
  const mandatoryBenefit = sum(mandatory, 'benefit');

  const mandatoryIds = new Set(mandatory.map(function (p) {
    return p.id;
  }));

  const optional = expandByStock(PRODUCTS.filter(function (p) {
    return !mandatoryIds.has(p.id);
  }));

  const remaining = budget - mandatoryCost;
  const cache = new Map();
  const optionalBest = wasmBestValue(optional, remaining, cache);
  const optionalSelected = pickOptionalProducts(optional, remaining, cache);

  if (optionalBest === -1 || optionalBest === -2) {
    return { error: 'WASM devolvio un error de validacion.' };
  }

  const optionalCost = sum(optionalSelected, 'price');

  return {
    mandatory: mandatory,
    optionalSelected: optionalSelected,
    mandatoryCost: mandatoryCost,
    mandatoryBenefit: mandatoryBenefit,
    optionalCost: optionalCost,
    remaining: remaining,
    optionalBest: optionalBest,
    totalBenefit: mandatoryBenefit + optionalBest
  };
}

function renderResult(plan, budget) {
  const node = document.getElementById('result');

  const mandatoryList = plan.mandatory.length
    ? `<ul class="list">
        ${plan.mandatory.map(p => `
          <li>
            <span>${p.name}</span>
            <span class="meta">${clp(p.price)} · Beneficio: ${p.benefit}</span>
          </li>
        `).join('')}
      </ul>`
    : '<p class="empty">No elegiste productos obligatorios.</p>';

  const optionalCounts = countByName(plan.optionalSelected);
  const optionalList = optionalCounts.length
    ? `<ul class="list">
        ${optionalCounts.map(([name, qty]) => `
          <li>
            <span>${name}</span>
            <span class="meta">x${qty}</span>
          </li>
        `).join('')}
      </ul>`
    : '<p class="empty">WASM no agregó productos opcionales.</p>';

  const finalProducts = plan.mandatory.concat(plan.optionalSelected);
  const finalList = finalProducts.length
    ? `<ul class="list">
        ${finalProducts.map(p => `<li>${p.name}</li>`).join('')}
      </ul>`
    : '<p class="empty">No hay productos en la compra.</p>';

  node.innerHTML = `
    <div class="result-grid">

      <!-- METRICS -->
      <div class="metrics">
        <div class="metric">
          <span>Presupuesto</span>
          <strong>${clp(budget)}</strong>
        </div>
        <div class="metric">
          <span>Costo obligatorio</span>
          <strong>${clp(plan.mandatoryCost)}</strong>
        </div>
        <div class="metric">
          <span>Beneficio obligatorio</span>
          <strong>${plan.mandatoryBenefit}</strong>
        </div>
        <div class="metric">
          <span>Costo opcional</span>
          <strong>${clp(plan.optionalCost)}</strong>
        </div>
        <div class="metric">
          <span>Beneficio opcional</span>
          <strong>${plan.optionalBest}</strong>
        </div>
        <div class="metric highlight">
          <span>Beneficio total</span>
          <strong>${plan.totalBenefit}</strong>
        </div>
      </div>

      <!-- SECTIONS -->
      <div class="result-section">
        <h3>Obligatorios</h3>
        ${mandatoryList}
      </div>

      <div class="result-section">
        <h3>Opcionales (WASM)</h3>
        ${optionalList}
      </div>

      <div class="result-section">
        <h3>Compra final</h3>
        ${finalList}
      </div>

    </div>
  `;
}

var Module = {
  onRuntimeInitialized: function () {
    knapsack = Module.cwrap('knapsack_csv', 'number', ['string', 'string', 'number']);
    const btnStock = document.getElementById('btn-stock');
    const btnBenefit = document.getElementById('btn-benefit');
    const btn = document.getElementById('btn');
    const status = document.getElementById('status');
    const resultNode = document.getElementById('result');

    btnStock.addEventListener('click', updateStockStatus);
    btnBenefit.addEventListener('click', updateBenefitStatus);
    renderProducts();
    btn.disabled = false;
    status.textContent = 'WASM listo.';

    btn.addEventListener('click', function () {
      const budget = parseInt(document.getElementById('budget').value, 10);

      if (Number.isNaN(budget) || budget < 0) {
        status.textContent = 'Error: presupuesto invalido.';
        resultNode.innerHTML = '';
        return;
      }

      applyStockFromInputs();
      applyBenefitsFromInputs();
      const plan = calculatePlan(budget);
      if (plan.error) {
        status.textContent = 'Error: ' + plan.error;
        resultNode.innerHTML = '';
        return;
      }

      status.textContent = 'Calculo completado con WASM.';
      renderResult(plan, budget);
    });
  }
};
