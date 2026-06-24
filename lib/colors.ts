// Subset of GitHub's official language color palette (github/linguist).
// Falls back to a neutral gray for languages not listed.
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Shell: "#89e051",
  PowerShell: "#012456",
  Lua: "#000080",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  R: "#198CE7",
  "Objective-C": "#438eff",
  Perl: "#0298c3",
  Solidity: "#AA6746",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Vim: "#199f4b",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Astro: "#ff5a03",
  Svelte: "#ff3e00",
  TeX: "#3D6117",
  "Vim Script": "#199f4b",
};

export function colorForLanguage(name: string): string {
  return LANGUAGE_COLORS[name] ?? "#8b949e";
}

// GitHub contribution heatmap levels -> colors (dark theme).
export const LEVEL_COLORS = [
  "#161b22", // 0 - none
  "#0e4429", // 1
  "#006d32", // 2
  "#26a641", // 3
  "#39d353", // 4
];
