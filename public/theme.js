(() => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "original" ? "original" : "modern";
  const stylesheet = document.getElementById("deck-theme");

  document.documentElement.dataset.theme = theme;
  if (stylesheet) {
    const version = new URL(stylesheet.href).search;
    stylesheet.href = theme === "modern" ? `/styles-modern.css${version}` : `/styles.css${version}`;
  }
})();
