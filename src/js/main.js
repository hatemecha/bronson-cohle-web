(function () {
  "use strict";

  var THEME_KEY = "bc-theme";
  var FONT_KEY = "bc-font-size";
  var root = document.documentElement;

  function getTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    updateThemeLabel();
  }

  function updateThemeLabel() {
    var label = document.querySelector("[data-theme-label]");
    if (!label) return;
    label.textContent = getTheme() === "dark" ? "Claro / Oscuro" : "Oscuro / Claro";
  }

  function setFontSize(size) {
    root.setAttribute("data-font-size", size);
    try {
      localStorage.setItem(FONT_KEY, size);
    } catch (e) {}
    document.querySelectorAll(".font-control").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-font") === size);
    });
  }

  function initReadingControls() {
    var currentSize = root.getAttribute("data-font-size") || "base";
    setFontSize(currentSize);
    updateThemeLabel();

    document.querySelectorAll(".font-control").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setFontSize(btn.getAttribute("data-font"));
      });
    });

    var themeBtn = document.querySelector(".theme-control");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      });
    }
  }

  function initShare() {
    document.querySelectorAll(".share-button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-share");
        var title = document.title;

        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () {});
          return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            var original = btn.textContent;
            btn.textContent = "copiado";
            window.setTimeout(function () {
              btn.textContent = original;
            }, 1500);
          });
        }
      });
    });
  }

  function initArchiveSort() {
    var list = document.getElementById("archivo-list");
    if (!list) return;

    var entries = Array.prototype.slice.call(
      list.querySelectorAll(".archivo-entry")
    );
    var yearHeadings = Array.prototype.slice.call(
      list.querySelectorAll(".archivo-year")
    );

    function render(mode) {
      var sorted = entries.slice();

      if (mode === "recientes") {
        sorted.sort(function (a, b) {
          return b.getAttribute("data-date").localeCompare(
            a.getAttribute("data-date")
          );
        });
      } else if (mode === "antiguos") {
        sorted.sort(function (a, b) {
          return a.getAttribute("data-date").localeCompare(
            b.getAttribute("data-date")
          );
        });
      } else if (mode === "az") {
        sorted.sort(function (a, b) {
          return a.getAttribute("data-title").localeCompare(
            b.getAttribute("data-title"),
            "es"
          );
        });
      }

      yearHeadings.forEach(function (heading) {
        heading.hidden = mode === "az";
      });

      sorted.forEach(function (entry) {
        list.appendChild(entry);
      });

      if (mode !== "az") {
        var seen = {};
        sorted.forEach(function (entry) {
          var year = entry.getAttribute("data-year");
          if (!seen[year]) {
            seen[year] = list.querySelector(
              '.archivo-year[data-year-heading="' + year + '"]'
            );
          }
          if (seen[year]) {
            list.insertBefore(seen[year], entry);
          }
        });
      }
    }

    document.querySelectorAll(".archive-sort").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".archive-sort").forEach(function (other) {
          other.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        render(btn.getAttribute("data-sort-mode"));
      });
    });
  }

  function initAzar() {
    var container = document.querySelector("[data-azar-urls]");
    if (!container) return;

    var urls;
    try {
      urls = JSON.parse(container.getAttribute("data-azar-urls"));
    } catch (e) {
      return;
    }

    if (!urls.length) return;

    var target = urls[Math.floor(Math.random() * urls.length)];
    window.location.replace(target);
  }

  function initSearch() {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    var status = document.getElementById("search-status");
    if (!input || !results) return;

    var pagefindReady = false;
    var timer;

    import("/pagefind/pagefind.js")
      .then(function (module) {
        pagefindReady = true;
        return module.default.init();
      })
      .catch(function () {
        if (status) {
          status.hidden = false;
          status.textContent =
            "El índice de búsqueda no está disponible. Ejecutá npm run build.";
        }
      });

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        runSearch(input.value.trim());
      }, 180);
    });

    function runSearch(query) {
      results.innerHTML = "";

      if (!query) {
        if (status) status.hidden = true;
        return;
      }

      if (!pagefindReady) {
        if (status) {
          status.hidden = false;
          status.textContent = "Buscando…";
        }
        return;
      }

      import("/pagefind/pagefind.js")
        .then(function (module) {
          return module.default.search(query);
        })
        .then(function (response) {
          if (status) status.hidden = true;

          if (!response || !response.results.length) {
            if (status) {
              status.hidden = false;
              status.textContent = "Sin resultados.";
            }
            return;
          }

          return Promise.all(
            response.results.slice(0, 12).map(function (result) {
              return result.data();
            })
          );
        })
        .then(function (items) {
          if (!items) return;

          items.forEach(function (item) {
            var li = document.createElement("li");
            var link = document.createElement("a");
            link.href = item.url;
            link.innerHTML =
              '<span class="search-result-title">' +
              item.meta.title +
              "</span>" +
              '<span class="search-result-excerpt">' +
              item.excerpt +
              "</span>";
            li.appendChild(link);
            results.appendChild(li);
          });
        });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReadingControls();
    initShare();
    initArchiveSort();
    initAzar();
    initSearch();
  });
})();
