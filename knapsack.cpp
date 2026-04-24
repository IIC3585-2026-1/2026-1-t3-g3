#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

int knapsackRecursive(vector<int>& weight,
                      vector<int>& value, int W, int n)
{
    if (n == 0 || W == 0)
        return 0;

    if (weight[n - 1] > W)
        return knapsackRecursive(weight, value, W, n - 1);

    return max(value[n - 1]
                   + knapsackRecursive(weight, value,
                                       W - weight[n - 1],
                                       n - 1),
               knapsackRecursive(weight, value, W, n - 1));
}

vector<int> parseCSV(const char* input) {
    vector<int> result;
    string s(input ? input : "");
    stringstream ss(s);
    string token;

    while (getline(ss, token, ',')) {
        if (!token.empty()) {
            result.push_back(stoi(token));
        }
    }

    return result;
}

extern "C" {
    int knapsack_csv(const char* weights_csv,
                     const char* values_csv,
                     int capacity)
    {
        vector<int> weights = parseCSV(weights_csv);
        vector<int> values = parseCSV(values_csv);

        if (weights.size() != values.size()) return -1;
        if (capacity < 0) return -2;

        int n = (int)weights.size();
        return knapsackRecursive(weights, values, capacity, n);
    }
}