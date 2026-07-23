(() => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "modern" ? "modern" : "original";
  const stylesheet = document.createElement("link");

  document.documentElement.dataset.theme = theme;
  stylesheet.id = "deck-theme";
  stylesheet.rel = "stylesheet";
  stylesheet.href = theme === "modern" ? "/styles-modern.css" : "/styles.css";
  document.head.append(stylesheet);
})();
