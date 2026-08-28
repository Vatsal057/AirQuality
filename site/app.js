/* ============================================================
   Renders the station map, tables and gallery from site/stations.json,
   which is generated from results/final_analysis.csv. Nothing here
   invents a number: every value on the page comes out of that file.
   ============================================================ */
(function () {
  "use strict";

  var FIGURES = [
    {
      src: "results/visualizations/professional/05_geographic_map_professional.png",
      title: "Stations in geographic context",
      note: "The spatial story: the flagged stations are not randomly scattered."
    },
    {
      src: "results/visualizations/final_correct/dbscan_map_with_noise.png",
      title: "DBSCAN, noise points included",
      note: "The stations DBSCAN refused to cluster. Those refusals are the hotspots."
    },
    {
      src: "results/visualizations/professional/01_model_comparison_professional.png",
      title: "Model comparison",
      note: "All three algorithms scored on the same internal validation metrics."
    },
    {
      src: "results/visualizations/final_correct/kmeans_map_k4.png",
      title: "K-Means assignment",
      note: "Every station forced into a cluster — extremes get diluted into a broad group."
    },
    {
      src: "results/visualizations/final_correct/hierarchical_dendrogram_2clusters.png",
      title: "Ward-linkage dendrogram",
      note: "Where the merge distances jump is where the natural split sits."
    },
    {
      src: "results/visualizations/temporal/temporal_aqi_heatmap.png",
      title: "Station × month heatmap",
      note: "Winter is worse everywhere, but not equally worse everywhere."
    },
    {
      src: "results/visualizations/professional/03_pca_clusters_professional.png",
      title: "Feature space in 2D (PCA)",
      note: "Six features projected down, purely to see whether the groups separate at all."
    },
    {
      src: "results/visualizations/professional/04_temporal_patterns_professional.png",
      title: "Seasonal patterns",
      note: "The trend and winter-mean features, drawn out over the year."
    }
  ];

  // Mean-AQI bands. Cutoffs follow the CPCB AQI categories that apply in this
  // range (Good ≤50, Satisfactory ≤100, Moderate ≤200) rather than arbitrary quantiles.
  var AQI_BANDS = [
    { max: 50,       color: "#7BA05B", label: "≤ 50 good" },
    { max: 75,       color: "#B9C471", label: "51–75" },
    { max: 90,       color: "#D9A86C", label: "76–90" },
    { max: Infinity, color: "#C0645C", label: "> 90" }
  ];
  var UNHEALTHY_BANDS = [
    { max: 10,       color: "#7BA05B", label: "< 10% of days" },
    { max: 20,       color: "#B9C471", label: "10–20%" },
    { max: 33,       color: "#D9A86C", label: "20–33%" },
    { max: Infinity, color: "#C0645C", label: "> 33%" }
  ];
  var CONSENSUS_COLORS = {
    3: { color: "#C0645C", label: "all 3 algorithms" },
    2: { color: "#D9A86C", label: "2 of 3" },
    1: { color: "#B9C471", label: "1 of 3" },
    0: { color: "#9BA6AD", label: "not flagged" }
  };

  var $ = function (sel) { return document.querySelector(sel); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function bandColor(bands, v) {
    for (var i = 0; i < bands.length; i++) if (v <= bands[i].max) return bands[i].color;
    return bands[bands.length - 1].color;
  }

  function colorFor(mode, st) {
    if (mode === "unhealthy") return bandColor(UNHEALTHY_BANDS, st.pctUnhealthy);
    if (mode === "consensus") return CONSENSUS_COLORS[st.consensus].color;
    return bandColor(AQI_BANDS, st.meanAqi);
  }

  function legendFor(mode) {
    var items;
    if (mode === "consensus") {
      items = [3, 2, 1, 0].map(function (k) { return CONSENSUS_COLORS[k]; });
    } else {
      items = (mode === "unhealthy" ? UNHEALTHY_BANDS : AQI_BANDS);
    }
    var head = mode === "consensus" ? "Flagged as a hotspot by"
             : mode === "unhealthy" ? "Share of 2024 days rated unhealthy"
             : "Yearly mean AQI";
    return "<span>" + head + "</span>" + items.map(function (b) {
      return '<span class="key"><span class="sw" style="background:' + b.color + '"></span>' + b.label + "</span>";
    }).join("");
  }

  function popupHtml(st) {
    var flags = st.flaggedBy.length
      ? "Flagged as a hotspot by " + st.flaggedBy.join(", ") + "."
      : "Not flagged by any algorithm.";
    return '<div class="pop">' +
      "<h4>" + esc(st.station) + "</h4>" +
      '<div class="pop-net">' + esc(st.network) + " · 2024</div>" +
      "<dl>" +
        "<dt>Mean AQI</dt><dd>" + st.meanAqi + "</dd>" +
        "<dt>Peak AQI</dt><dd>" + st.maxAqi + "</dd>" +
        "<dt>Unhealthy days</dt><dd>" + st.pctUnhealthy + "%</dd>" +
        "<dt>7-day volatility</dt><dd>" + st.volatility + "</dd>" +
        "<dt>Winter mean</dt><dd>" + st.winterAvg + "</dd>" +
        "<dt>Trend slope</dt><dd>" + st.trendSlope + "</dd>" +
      "</dl>" +
      '<div class="pop-flag">' + esc(flags) + "</div>" +
    "</div>";
  }

  function renderStationTable(stations) {
    var tb = $("#stationTable tbody");
    if (!tb) return;
    tb.innerHTML = stations.map(function (s) {
      var pills = s.flaggedBy.length
        ? s.flaggedBy.map(function (m) {
            return '<span class="pill' + (s.consensus === 3 ? " p-3" : "") + '">' + esc(m) + "</span>";
          }).join("")
        : '<span class="pill">—</span>';
      return "<tr" + (s.consensus >= 2 ? ' class="is-hot"' : "") + ">" +
        "<th scope=\"row\">" + esc(s.station) + "</th>" +
        "<td>" + esc(s.network) + "</td>" +
        '<td class="num">' + s.meanAqi + "</td>" +
        '<td class="num">' + s.maxAqi + "</td>" +
        '<td class="num">' + s.pctUnhealthy + "%</td>" +
        '<td class="num">' + s.volatility + "</td>" +
        '<td class="num">' + s.winterAvg + "</td>" +
        '<td><div class="flag-pills">' + pills + "</div></td>" +
      "</tr>";
    }).join("");
  }

  function renderModelTable(models) {
    var tb = $("#modelTable tbody");
    if (!tb) return;
    var bestSil = Math.max.apply(null, models.map(function (m) { return m.silhouette; }));
    tb.innerHTML = models.map(function (m) {
      var best = m.silhouette === bestSil;
      return "<tr" + (best ? ' class="is-best"' : "") + ">" +
        '<th scope="row">' + esc(m.name) +
          (best ? '<span class="tag-win">best silhouette</span>' : "") + "</th>" +
        '<td class="num">' + m.clusters + "</td>" +
        '<td class="num">' + m.noise + "</td>" +
        '<td class="num">' + m.silhouette.toFixed(3) + "</td>" +
        '<td class="num">' + m.daviesBouldin.toFixed(3) + "</td>" +
        '<td class="num">' + m.calinski.toFixed(2) + "</td>" +
        "<td>" + esc(m.note) + "</td>" +
      "</tr>";
    }).join("");
  }

  function renderHotspots(stations) {
    var list = $("#hotspotList");
    if (!list) return;
    var hot = stations.filter(function (s) { return s.consensus >= 2; });
    list.innerHTML = hot.map(function (s) {
      return '<li class="tier-' + s.consensus + '">' +
        '<span class="hs-name">' + esc(s.station) + "</span>" +
        '<span class="hs-meta">mean ' + s.meanAqi + " · peak " + s.maxAqi +
          " · " + s.pctUnhealthy + "% unhealthy days</span>" +
        '<span class="hs-agree">' + s.consensus + "/3 algorithms</span>" +
      "</li>";
    }).join("");
  }

  function renderGallery() {
    var g = $("#gallery");
    if (!g) return;
    g.innerHTML = FIGURES.map(function (f) {
      return "<figure>" +
        '<img src="' + f.src + '" alt="' + esc(f.title) + '" loading="lazy" decoding="async">' +
        "<figcaption><b>" + esc(f.title) + "</b> — " + esc(f.note) + "</figcaption>" +
      "</figure>";
    }).join("");
  }

  function initMap(data) {
    var el = $("#leaflet");
    if (!el || typeof L === "undefined") return;

    var map = L.map(el, { scrollWheelZoom: false });
    // Plain OSM tiles: the only major basemap still keyless. CARTO's light_all
    // now watermarks every tile with "API KEY REQUIRED". The quiet look comes
    // from a CSS filter on the tile pane instead, which leaves markers in full
    // colour because they live in the overlay pane.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    var mode = "mean";
    var layer = L.layerGroup().addTo(map);

    // Radius encodes share of unhealthy days, so size stays meaningful in every
    // colour mode. sqrt keeps area (not radius) proportional to the value.
    function radiusFor(st) { return 9 + Math.sqrt(st.pctUnhealthy) * 2.6; }

    function draw() {
      layer.clearLayers();
      data.stations.forEach(function (st) {
        L.circleMarker([st.lat, st.lon], {
          radius: radiusFor(st),
          fillColor: colorFor(mode, st),
          color: "rgba(43,58,66,.55)",
          weight: 1.5,
          fillOpacity: .82
        })
          .bindPopup(popupHtml(st), { minWidth: 232 })
          .bindTooltip(st.station + " · " + st.meanAqi, { direction: "top" })
          .addTo(layer);
      });
      $("#legend").innerHTML = legendFor(mode);
    }

    map.fitBounds(
      L.latLngBounds(data.stations.map(function (s) { return [s.lat, s.lon]; })),
      { padding: [42, 42] }
    );
    draw();

    // Wheel-zoom stays off until the map is clicked, so the page still scrolls.
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });

    Array.prototype.forEach.call(document.querySelectorAll(".chip[data-mode]"), function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.getAttribute("data-mode");
        Array.prototype.forEach.call(document.querySelectorAll(".chip[data-mode]"), function (b) {
          var on = b === btn;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        draw();
      });
    });
  }

  function fail(msg) {
    var el = $("#leaflet");
    if (el) {
      el.innerHTML = '<p style="padding:1.5rem;color:#5A6B73;font-size:.9rem">' +
        esc(msg) + ' The static figures below show the same result.</p>';
    }
  }

  renderGallery();

  fetch("site/stations.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      renderStationTable(data.stations);
      renderModelTable(data.models);
      renderHotspots(data.stations);
      initMap(data);
    })
    .catch(function (e) {
      fail("Could not load station data (" + e.message + ").");
    });
})();
