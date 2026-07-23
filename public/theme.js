(() => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "modern" ? "modern" : "original";
  const stylesheet = document.getElementById("deck-theme");

  document.documentElement.dataset.theme = theme;
  if (theme === "modern" && stylesheet) {
    const version = new URL(stylesheet.href).search;
    stylesheet.href = `/styles-modern.css${version}`;
  }
})();
