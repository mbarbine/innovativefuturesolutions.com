(() => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "modern" ? "modern" : "original";
  const stylesheet = document.getElementById("deck-theme");

  document.documentElement.dataset.theme = theme;
  if (theme === "modern" && stylesheet) {
    stylesheet.href = "/styles-modern.css?v=20260723.1";
  }
})();
