const PRODUCTS = [
  { id: 1, name: 'Leche', price: 3000, benefit: 6 },
  { id: 2, name: 'Pan', price: 2000, benefit: 4 },
  { id: 3, name: 'Huevos', price: 3500, benefit: 7 },
  { id: 4, name: 'Arroz', price: 2500, benefit: 5 },
  { id: 5, name: 'Pollo', price: 5000, benefit: 10 },
  { id: 6, name: 'Fruta', price: 2000, benefit: 5 },
  { id: 7, name: 'Fideos', price: 2200, benefit: 5 },
  { id: 8, name: 'Atun', price: 3200, benefit: 6 }
];

let knapsack = null;

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

function renderProducts() {
  const node = document.getElementById('products');
  node.innerHTML = PRODUCTS.map(function (p) {
    return `<label class="product"><input type="checkbox" data-id="${p.id}"><span>${p.name} | Costo ${clp(p.price)} | Beneficio ${p.benefit}</span></label>`;
  }).join('');
}

function getMandatoryProducts() {
  return PRODUCTS.filter(function (p) {
    const checkbox = document.querySelector(`input[data-id="${p.id}"]`);
    return checkbox && checkbox.checked;
  });
}

function calculatePlan(budget) {
  const mandatory = getMandatoryProducts();
  const mandatoryCost = sum(mandatory, 'price');
  const mandatoryBenefit = sum(mandatory, 'benefit');

  if (mandatoryCost > budget) {
    return { error: 'Los productos obligatorios superan el presupuesto.' };
  }

  const mandatoryIds = new Set(mandatory.map(function (p) {
    return p.id;
  }));

  const optional = PRODUCTS.filter(function (p) {
    return !mandatoryIds.has(p.id);
  });

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
    ? `<ul>${plan.mandatory.map(function (p) { return `<li>${p.name} (${clp(p.price)} / ${p.benefit})</li>`; }).join('')}</ul>`
    : '<p>No elegiste productos obligatorios.</p>';

  const optionalList = plan.optionalSelected.length
    ? `<ul>${plan.optionalSelected.map(function (p) { return `<li>${p.name} (${clp(p.price)} / ${p.benefit})</li>`; }).join('')}</ul>`
    : '<p>WASM no agrego productos opcionales.</p>';

  const finalProducts = plan.mandatory.concat(plan.optionalSelected);
  const finalList = finalProducts.length
    ? `<ul>${finalProducts.map(function (p) { return `<li>${p.name}</li>`; }).join('')}</ul>`
    : '<p>No hay productos en la compra.</p>';

  node.innerHTML = `
    <p><strong>Presupuesto:</strong> ${clp(budget)}</p>
    <p><strong>Costo obligatorio:</strong> ${clp(plan.mandatoryCost)}</p>
    <p><strong>Beneficio obligatorio:</strong> ${plan.mandatoryBenefit}</p>
    <p><strong>Costo opcional elegido:</strong> ${clp(plan.optionalCost)} (de ${clp(plan.remaining)} disponibles)</p>
    <p><strong>Beneficio maximo opcional (WASM):</strong> ${plan.optionalBest}</p>
    <p><strong>Beneficio total:</strong> ${plan.totalBenefit}</p>
    <h3>Obligatorios</h3>
    ${mandatoryList}
    <h3>Opcionales elegidos por WASM</h3>
    ${optionalList}
    <h3>Compra final</h3>
    ${finalList}
  `;
}

var Module = {
  onRuntimeInitialized: function () {
    knapsack = Module.cwrap('knapsack_csv', 'number', ['string', 'string', 'number']);

    const btn = document.getElementById('btn');
    const status = document.getElementById('status');
    const resultNode = document.getElementById('result');

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
