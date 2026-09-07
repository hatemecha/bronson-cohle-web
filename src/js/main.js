(function () {
  "use strict";

  var THEME_KEY = "bc-theme";
  var FONT_KEY = "bc-font-size";
  var READING_KEY = "bc-reading";
  var root = document.documentElement;
  var baseUrl = root.getAttribute("data-base-url") || "/";
  var panelOpen = false;

  function withBaseUrl(path) {
    var normalizedPath = String(path || "").replace(/^\/+/, "");
    return baseUrl + normalizedPath;
  }

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
    if (btn) {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
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
        setReading(root.getAttribute("data-reading") !== "on");
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
      if (e.key === "Escape" && panelOpen) closePanel();
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
    var monthHeadings = Array.prototype.slice.call(
      list.querySelectorAll(".archivo-month")
    );
    var yearByKey = {};
    var monthByKey = {};

    yearHeadings.forEach(function (heading) {
      yearByKey[heading.getAttribute("data-year-heading")] = heading;
    });
    monthHeadings.forEach(function (heading) {
      monthByKey[heading.getAttribute("data-month-heading")] = heading;
    });

    var state = { mode: "date", desc: true };

    function updateButtons() {
      document.querySelectorAll(".archive-sort").forEach(function (btn) {
        var btnMode = btn.getAttribute("data-sort-mode");
        var label = btn.getAttribute("data-sort-label") || btnMode;
        var active =
          (state.mode === "date" && btnMode === "recientes" && state.desc) ||
          (state.mode === "date" && btnMode === "antiguos" && !state.desc) ||
          (state.mode === "az" && btnMode === "az");

        btn.classList.toggle("is-active", active);

        if (active && btnMode === "az") {
          btn.textContent = label + (state.desc ? " ↓" : " ↑");
        } else {
          btn.textContent = label;
        }

        if (active) {
          btn.setAttribute(
            "aria-sort",
            state.desc ? "descending" : "ascending"
          );
        } else {
          btn.removeAttribute("aria-sort");
        }
      });
    }

    function render() {
      var sorted = entries.slice();

      if (state.mode === "date") {
        sorted.sort(function (a, b) {
          var cmp = a.getAttribute("data-date").localeCompare(
            b.getAttribute("data-date")
          );
          return state.desc ? -cmp : cmp;
        });
      } else if (state.mode === "az") {
        sorted.sort(function (a, b) {
          var cmp = a.getAttribute("data-title").localeCompare(
            b.getAttribute("data-title"),
            "es"
          );
          return state.desc ? -cmp : cmp;
        });
      }

      list.replaceChildren();

      if (state.mode === "az") {
        sorted.forEach(function (entry) {
          list.appendChild(entry);
        });
      } else {
        var seenYear = {};
        var seenMonth = {};

        sorted.forEach(function (entry) {
          var year = entry.getAttribute("data-year");
          var month = entry.getAttribute("data-month");

          if (!seenYear[year] && yearByKey[year]) {
            seenYear[year] = true;
            list.appendChild(yearByKey[year]);
          }
          if (!seenMonth[month] && monthByKey[month]) {
            seenMonth[month] = true;
            list.appendChild(monthByKey[month]);
          }
          list.appendChild(entry);
        });
      }

      updateButtons();
    }

    document.querySelectorAll(".archive-sort").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var btnMode = btn.getAttribute("data-sort-mode");

        if (btnMode === "recientes") {
          state.mode = "date";
          state.desc = true;
        } else if (btnMode === "antiguos") {
          state.mode = "date";
          state.desc = false;
        } else if (btnMode === "az") {
          if (state.mode === "az") {
            state.desc = !state.desc;
          } else {
            state.mode = "az";
            state.desc = false;
          }
        }

        render();
      });
    });

    render();
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
    var pagefindLoading = false;
    var pagefindModule = null;
    var timer;

    function showStatus(message) {
      if (!status) return;
      status.hidden = false;
      status.textContent = message;
    }

    function hideStatus() {
      if (status) status.hidden = true;
    }

    function loadPagefind() {
      if (pagefindReady || pagefindLoading) return;
      pagefindLoading = true;
      showStatus("Preparando búsqueda…");

      import(withBaseUrl("pagefind/pagefind.js"))
        .then(function (module) {
          pagefindModule = module;
          return module.init();
        })
        .then(function () {
          pagefindReady = true;
          hideStatus();
          if (input.value.trim()) runSearch(input.value.trim());
        })
        .catch(function () {
          showStatus("La búsqueda no está disponible por el momento.");
        })
        .finally(function () {
          pagefindLoading = false;
        });
    }

    loadPagefind();

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        runSearch(input.value.trim());
      }, 180);
    });

    function runSearch(query) {
      results.innerHTML = "";

      if (!query) {
        hideStatus();
        return;
      }

      if (!pagefindReady) {
        if (!pagefindLoading) loadPagefind();
        else showStatus("Preparando búsqueda…");
        return;
      }

      if (!pagefindModule) {
        showStatus("Preparando búsqueda…");
        return;
      }

      showStatus("Buscando…");

      pagefindModule
        .search(query)
        .then(function (response) {
          hideStatus();

          if (!response || !response.results.length) {
            showStatus("Sin resultados para esa búsqueda.");
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
            link.href = item.url.indexOf(baseUrl) === 0
              ? item.url
              : withBaseUrl(item.url);
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
        })
        .catch(function () {
          showStatus("No se pudo completar la búsqueda.");
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
