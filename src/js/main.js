(function () {
  "use strict";

  var THEME_KEY = "bc-theme";
  var FONT_KEY = "bc-font-size";
  var READING_KEY = "bc-reading";
  var root = document.documentElement;
  var panelOpen = false;

  function getTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    document.querySelectorAll(".theme-control").forEach(function (btn) {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-theme") === theme
      );
    });
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

  function setReading(on) {
    if (on) {
      root.setAttribute("data-reading", "on");
    } else {
      root.removeAttribute("data-reading");
    }
    try {
      localStorage.setItem(READING_KEY, on ? "on" : "off");
    } catch (e) {}
    var btn = document.querySelector(".reading-control");
    if (btn) btn.classList.toggle("is-active", on);
  }

  function closePanel() {
    var panel = document.getElementById("a11y-panel");
    var toggle = document.querySelector(".a11y-toggle");
    if (!panel || !toggle) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    panelOpen = false;
  }

  function togglePanel() {
    var panel = document.getElementById("a11y-panel");
    var toggle = document.querySelector(".a11y-toggle");
    if (!panel || !toggle) return;
    panelOpen = !panelOpen;
    panel.hidden = !panelOpen;
    toggle.setAttribute("aria-expanded", panelOpen ? "true" : "false");
  }

  function initA11y() {
    var currentSize = root.getAttribute("data-font-size") || "base";
    setFontSize(currentSize);
    setTheme(getTheme());
    setReading(root.getAttribute("data-reading") === "on");

    document.querySelectorAll(".font-control").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setFontSize(btn.getAttribute("data-font"));
      });
    });

    document.querySelectorAll(".theme-control").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTheme(btn.getAttribute("data-theme"));
      });
    });

    var readingBtn = document.querySelector(".reading-control");
    if (readingBtn) {
      readingBtn.addEventListener("click", function () {
        var on = root.getAttribute("data-reading") !== "on";
        if (on) {
          setTheme("light");
          setFontSize("lg");
        }
        setReading(on);
      });
    }

    var panel = document.getElementById("a11y-panel");
    if (panel) {
      panel.addEventListener("click", function (e) {
        if (e.target.closest(".text-button")) closePanel();
      });
    }

    var toggle = document.querySelector(".a11y-toggle");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        togglePanel();
      });
    }

    document.addEventListener("click", function (e) {
      if (!panelOpen) return;
      if (e.target.closest(".a11y")) return;
      closePanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
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
    initA11y();
    initShare();
    initArchiveSort();
    initAzar();
    initSearch();
  });
})();
