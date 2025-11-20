const htmlElement = document.documentElement;
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const setTheme = (theme) => {
  if (theme === 'dark') {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme('dark');
  }
};

const toggleTheme = () => {
  if (htmlElement.classList.contains('dark')) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
};

const toggleLargeText = () => {
  const isLarge = htmlElement.getAttribute('data-large-text') === 'true';
  htmlElement.setAttribute('data-large-text', String(!isLarge));
  localStorage.setItem('large-text', String(!isLarge));
};

const initLargeText = () => {
  const largeTextPreference = localStorage.getItem('large-text');
  if (largeTextPreference === 'true') {
    htmlElement.setAttribute('data-large-text', 'true');
  }
};

const initCurrentYear = () => {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLargeText();
  initCurrentYear();

  const themeToggleButton = document.getElementById('theme-toggle');
  themeToggleButton?.addEventListener('click', toggleTheme);

  const textToggleButton = document.getElementById('text-toggle');
  textToggleButton?.addEventListener('click', toggleLargeText);
});

systemPrefersDark.addEventListener('change', (event) => {
  if (!localStorage.getItem('theme')) {
    setTheme(event.matches ? 'dark' : 'light');
  }
});
