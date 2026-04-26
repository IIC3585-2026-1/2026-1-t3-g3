function knapsackRecursive01(weights, values, capacity, n) {
  if (n === 0 || capacity === 0) {
    return 0;
  }

  if (weights[n - 1] > capacity) {
    return knapsackRecursive01(weights, values, capacity, n - 1);
  }

  const withLast = values[n - 1]
    + knapsackRecursive01(weights, values, capacity - weights[n - 1], n - 1);
  const withoutLast = knapsackRecursive01(weights, values, capacity, n - 1);

  return Math.max(withLast, withoutLast);
}

window.knapsackRecursive01 = knapsackRecursive01;
