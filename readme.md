* Codigo para iniciar.
emcc main.c -O2   -s WASM=1   -s EXPORTED_FUNCTIONS='["_prepare_knapsack","_malloc","_free"]'   -s EXPORTED_RUNTIME_METHODS='["ccall"]'   -o main.js