// Color palettes for our self-hosted stat cards. Keys match the theme options
// exposed in the README generator (lib/readme.ts THEMES).

export interface CardTheme {
  title: string;
  icon: string;
  text: string;
  bg: string;
  border: string;
  accent: string;
}

const THEMES: Record<string, CardTheme> = {
  tokyonight: {
    title: "#70a5fd",
    icon: "#bf91f3",
    text: "#a9b1d6",
    bg: "#1a1b27",
    border: "#2a2e44",
    accent: "#38bdae",
  },
  github_dark: {
    title: "#58a6ff",
    icon: "#1f6feb",
    text: "#c3d1d9",
    bg: "#0d1117",
    border: "#30363d",
    accent: "#39d353",
  },
  radical: {
    title: "#fe428e",
    icon: "#f8d847",
    text: "#a9fef7",
    bg: "#141321",
    border: "#2b2a3a",
    accent: "#fe428e",
  },
  dracula: {
    title: "#ff6e96",
    icon: "#79dafa",
    text: "#f8f8f2",
    bg: "#282a36",
    border: "#44475a",
    accent: "#bd93f9",
  },
  gruvbox: {
    title: "#fabd2f",
    icon: "#fe8019",
    text: "#ebdbb2",
    bg: "#282828",
    border: "#3c3836",
    accent: "#8ec07c",
  },
  onedark: {
    title: "#e4bf7a",
    icon: "#8eb573",
    text: "#abb2bf",
    bg: "#282c34",
    border: "#3a3f4b",
    accent: "#61afef",
  },
  merko: {
    title: "#abd200",
    icon: "#b7a900",
    text: "#68b587",
    bg: "#0a0f0b",
    border: "#1c2b1c",
    accent: "#abd200",
  },
  nord: {
    title: "#81a1c1",
    icon: "#88c0d0",
    text: "#d8dee9",
    bg: "#2e3440",
    border: "#3b4252",
    accent: "#a3be8c",
  },
};

export function cardTheme(key?: string | null): CardTheme {
  return THEMES[key ?? ""] ?? THEMES.github_dark;
}
