(function () {
  try {
    var raw = localStorage.getItem("home-os:preferences-cache");
    var theme = "dark";
    if (raw) {
      var preferences = JSON.parse(raw);
      if (preferences.theme) theme = preferences.theme;
    }

    var dark =
      theme === "dark" ||
      (theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();
