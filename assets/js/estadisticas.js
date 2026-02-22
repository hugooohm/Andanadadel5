function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

var STATS_STATE = {
    season: "2026",
    tipo: "matadores",
    data: null,
    sortKey: "orejas",
    sortDir: "desc",
    filterText: ""
};

function cargarTemporada(season) {
    return fetch("content/stats/" + encodeURIComponent(season) + ".json", { cache: "no-cache" })
        .then(function (res) {
            if (!res.ok) {
                throw new Error("No se pudieron cargar las estadísticas de la temporada " + season);
            }
            return res.json();
        });
}

function setActiveTab(tipo) {
    var tabs = document.querySelectorAll(".stats-tab");
    tabs.forEach(function (tab) {
        if (tab.getAttribute("data-type") === tipo) {
            tab.classList.add("stats-tab--active");
        } else {
            tab.classList.remove("stats-tab--active");
        }
    });
}

function renderTabsTipo() {
    var tabs = document.querySelectorAll(".stats-tab");
    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            var tipo = tab.getAttribute("data-type");
            if (!tipo || tipo === STATS_STATE.tipo) return;
            STATS_STATE.tipo = tipo;
            setActiveTab(tipo);
            renderTabla(STATS_STATE.data, STATS_STATE.tipo);
        });
    });
}

function getTipoLabel(tipo) {
    if (tipo === "matadores") return "Matadores";
    if (tipo === "novilleros") return "Novilleros";
    if (tipo === "rejoneadores") return "Rejoneadores";
    if (tipo === "ganaderias") return "Ganaderías";
    return "";
}

function ordenarPor(columna) {
    if (STATS_STATE.sortKey === columna) {
        STATS_STATE.sortDir = STATS_STATE.sortDir === "asc" ? "desc" : "asc";
    } else {
        STATS_STATE.sortKey = columna;
        STATS_STATE.sortDir = columna === "nombre" ? "asc" : "desc";
    }
    renderTabla(STATS_STATE.data, STATS_STATE.tipo);
}

function filtrarPorTexto(q) {
    STATS_STATE.filterText = q || "";
    renderTabla(STATS_STATE.data, STATS_STATE.tipo);
}

function navegarPerfil(id, tipo, season) {
    var url = "perfil.html?id=" + encodeURIComponent(id) +
        "&type=" + encodeURIComponent(tipo) +
        "&season=" + encodeURIComponent(season);
    window.location.href = url;
}

function getVisibleRows(data, tipo) {
    if (!data || !data[tipo]) return [];
    var rows = data[tipo].slice();
    if (STATS_STATE.filterText) {
        var q = STATS_STATE.filterText.toLowerCase();
        rows = rows.filter(function (item) {
            return String(item.nombre || "").toLowerCase().indexOf(q) !== -1;
        });
    }
    var key = STATS_STATE.sortKey;
    var dir = STATS_STATE.sortDir === "asc" ? 1 : -1;
    rows.sort(function (a, b) {
        var va = a[key];
        var vb = b[key];
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va === vb) return 0;
        return va > vb ? dir : -dir;
    });
    return rows.slice(0, 20);
}

function renderTabla(data, tipo) {
    var container = document.getElementById("stats-table-container");
    if (!container) return;
    container.innerHTML = "";
    if (!data || !data[tipo] || !data[tipo].length) {
        var empty = document.createElement("p");
        empty.className = "stats-empty";
        empty.textContent = "No hay datos disponibles para esta combinación de temporada y tipo.";
        container.appendChild(empty);
        return;
    }
    var table = document.createElement("table");
    table.className = "stats-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");

    function addHeadCell(key, label) {
        var th = document.createElement("th");
        th.textContent = label;
        th.setAttribute("data-key", key);
        th.tabIndex = 0;
        th.addEventListener("click", function () {
            ordenarPor(key);
        });
        th.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                ordenarPor(key);
            }
        });
        if (STATS_STATE.sortKey === key) {
            th.classList.add("stats-table__th--sorted-" + STATS_STATE.sortDir);
        }
        headRow.appendChild(th);
    }

    addHeadCell("pos", "Pos.");
    addHeadCell("nombre", "Nombre");
    if (tipo === "ganaderias") {
        addHeadCell("corridas", "Corridas");
        addHeadCell("toros", "Toros");
        addHeadCell("orejas", "Orejas");
        addHeadCell("vueltas", "Vueltas");
        addHeadCell("saludos", "Saludos");
        addHeadCell("palmas", "Palmas");
        addHeadCell("silencios", "Silencios");
        addHeadCell("pitos", "Pitos");
        addHeadCell("broncas", "Broncas");
        addHeadCell("avisos", "Avisos");
    } else {
        addHeadCell("festejos", "Festejos");
        addHeadCell("orejas", "Orejas");
        addHeadCell("rabos", "Rabos");
        addHeadCell("bloqueA_1a", "1ª");
        addHeadCell("bloqueA_2a", "2ª");
        addHeadCell("bloqueA_3a", "3ª");
        addHeadCell("bloqueB_1a", "1ª");
        addHeadCell("bloqueB_2a", "2ª");
        addHeadCell("bloqueB_3a", "3ª");
        addHeadCell("reses_lidiadas", "Reses lidiadas");
    }

    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    var rows = getVisibleRows(data, tipo);
    rows.forEach(function (item, index) {
        var tr = document.createElement("tr");
        tr.className = "stats-row";
        tr.tabIndex = 0;
        tr.addEventListener("click", function () {
            navegarPerfil(item.id, tipo, STATS_STATE.season);
        });
        tr.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                navegarPerfil(item.id, tipo, STATS_STATE.season);
            }
        });

        function addCell(value) {
            var td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        }

        addCell(index + 1);
        addCell(item.nombre || "");
        if (tipo === "ganaderias") {
            addCell(item.corridas != null ? item.corridas : 0);
            addCell(item.toros != null ? item.toros : 0);
            addCell(item.orejas != null ? item.orejas : 0);
            addCell(item.vueltas != null ? item.vueltas : 0);
            addCell(item.saludos != null ? item.saludos : 0);
            addCell(item.palmas != null ? item.palmas : 0);
            addCell(item.silencios != null ? item.silencios : 0);
            addCell(item.pitos != null ? item.pitos : 0);
            addCell(item.broncas != null ? item.broncas : 0);
            addCell(item.avisos != null ? item.avisos : 0);
        } else {
            addCell(item.festejos != null ? item.festejos : 0);
            addCell(item.orejas != null ? item.orejas : 0);
            addCell(item.rabos != null ? item.rabos : 0);
            addCell(item.bloqueA_1a != null ? item.bloqueA_1a : 0);
            addCell(item.bloqueA_2a != null ? item.bloqueA_2a : 0);
            addCell(item.bloqueA_3a != null ? item.bloqueA_3a : 0);
            addCell(item.bloqueB_1a != null ? item.bloqueB_1a : 0);
            addCell(item.bloqueB_2a != null ? item.bloqueB_2a : 0);
            addCell(item.bloqueB_3a != null ? item.bloqueB_3a : 0);
            addCell(item.reses_lidiadas != null ? item.reses_lidiadas : 0);
        }

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

function initStatsSearch() {
    var input = document.getElementById("stats-search-input");
    if (!input) return;
    input.addEventListener("input", function () {
        filtrarPorTexto(input.value || "");
    });
}

function initSeasonSelector() {
    var select = document.getElementById("stats-season-select");
    if (!select) return;
    select.value = STATS_STATE.season;
    select.addEventListener("change", function () {
        var season = select.value || "2026";
        STATS_STATE.season = season;
        cargarTemporada(season)
            .then(function (data) {
                STATS_STATE.data = data;
                var updatedEl = document.getElementById("stats-updated");
                if (updatedEl) {
                    updatedEl.textContent = data.updatedAt || "–";
                }
                STATS_STATE.sortKey = "orejas";
                STATS_STATE.sortDir = "desc";
                renderTabla(STATS_STATE.data, STATS_STATE.tipo);
            })
            .catch(function () {
                var container = document.getElementById("stats-table-container");
                if (container) {
                    container.innerHTML = "";
                    var error = document.createElement("p");
                    error.className = "stats-empty";
                    error.textContent = "No se pudieron cargar las estadísticas de la temporada seleccionada.";
                    container.appendChild(error);
                }
            });
    });
}

function initEstadisticasPage() {
    var initialSeason = getQueryParam("season") || "2026";
    var initialTipo = getQueryParam("type") || "matadores";
    STATS_STATE.season = initialSeason;
    STATS_STATE.tipo = initialTipo;
    var select = document.getElementById("stats-season-select");
    if (select) {
        select.value = initialSeason;
    }
    setActiveTab(initialTipo);
    renderTabsTipo();
    initStatsSearch();
    initSeasonSelector();
    cargarTemporada(STATS_STATE.season)
        .then(function (data) {
            STATS_STATE.data = data;
            var updatedEl = document.getElementById("stats-updated");
            if (updatedEl) {
                updatedEl.textContent = data.updatedAt || "–";
            }
            renderTabla(STATS_STATE.data, STATS_STATE.tipo);
        })
        .catch(function () {
            var container = document.getElementById("stats-table-container");
            if (container) {
                container.innerHTML = "";
                var error = document.createElement("p");
                    error.className = "stats-empty";
                    error.textContent = "No se pudieron cargar las estadísticas.";
                    container.appendChild(error);
            }
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEstadisticasPage);
} else {
    initEstadisticasPage();
}
