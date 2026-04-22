#include <emscripten/emscripten.h>

#define MAX_N 100
#define MAX_W 100
#define MAX_V 100
#define MAX_M 100


EMSCRIPTEN_KEEPALIVE
int prepare_knapsack(int n, int M, const int* W, const int* V) {
    if (n < 1 || n > MAX_N) return -1;
    if (M < 0 || M > MAX_M) return -2;

    for (int i = 0; i < n; i++) {
        if (W[i] < 0 || W[i] > MAX_W) return -3;
        if (V[i] < 0 || V[i] > MAX_V) return -4;
    }

    int test = 0;
    for (int i = 0; i < n; i++) {
        test += W[i] + V[i];
    }
    return test;
}