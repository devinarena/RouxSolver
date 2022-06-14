

#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

/**
 * @brief Leetcode 583. Delete Operation for Two Strings
 *
 * Solved 6/13/2022
 */

class Solution {
 public:
  int minDistance(string word1, string word2) {
    vector<vector<int>> dp(word1.size() + 1, vector<int>(word2.size() + 1, 0));

    for (int i = 0; i < word1.size(); i++) {
      for (int j = 0; j < word2.size(); j++) {
        if (i == 0 || j == 0)
          continue;
        if (word1[i] == word2[j])
          dp[i][j] = 1 + max(dp[i - 1][j], dp[i][j - 1]);
        else
          dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    return dp[word1.size()][word2.size()];
  }
};