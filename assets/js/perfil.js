function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function cargarPerfilBase(id) {
    return fetch("content/stats/perfiles/" + encodeURIComponent(id) + ".json", { cache: "no-cache" })
        .then(function (res) {
            if (!res.ok) {
                throw new Error("No se pudo cargar el perfil solicitado");
            }
            return res.json();
        });
}

function cargarTemporadaStats(season) {
    return fetch("content/stats/" + encodeURIComponent(season) + ".json", { cache: "no-cache" })
        .then(function (res) {
            if (!res.ok) {
                throw new Error("No se pudieron cargar las estadísticas de la temporada");
            }
            return res.json();
        });
}

function renderFotoPerfil(container, perfil, statsItem) {
    container.innerHTML = "";
    var fotoUrl = perfil.foto || (statsItem && statsItem.foto) || "";
    if (fotoUrl) {
        var img = document.createElement("img");
        img.className = "profile-photo";
        img.src = fotoUrl;
        img.alt = perfil.nombre || "";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", function () {
            container.innerHTML = "";
            var placeholder = document.createElement("div");
            placeholder.className = "profile-photo profile-photo--placeholder";
            var span = document.createElement("span");
            span.className = "profile-photo__initial";
            span.textContent = (perfil.nombre || "?").charAt(0).toUpperCase();
            placeholder.appendChild(span);
            container.appendChild(placeholder);
        });
        container.appendChild(img);
    } else {
        var placeholder = document.createElement("div");
        placeholder.className = "profile-photo profile-photo--placeholder";
        var span = document.createElement("span");
        span.className = "profile-photo__initial";
        span.textContent = (perfil.nombre || "?").charAt(0).toUpperCase();
        placeholder.appendChild(span);
        container.appendChild(placeholder);
    }
}

function renderLinksPerfil(listEl, perfil) {
    listEl.innerHTML = "";
    if (!perfil.enlaces || !perfil.enlaces.length) return;
    perfil.enlaces.forEach(function (enlace) {
        var li = document.createElement("li");
        li.className = "profile-links__item";
        var a = document.createElement("a");
        a.className = "profile-links__link";
        a.href = enlace.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = enlace.label || enlace.url;
        li.appendChild(a);
        listEl.appendChild(li);
    });
}

function renderStatsPerfil(container, tipo, statsItem, season, updatedAt) {
    container.innerHTML = "";
    if (!statsItem) {
        var empty = document.createElement("p");
        empty.className = "stats-empty";
        empty.textContent = "No hay estadísticas registradas para esta temporada.";
        container.appendChild(empty);
        return;
    }
    var table = document.createElement("table");
    table.className = "stats-table stats-table--compact";
    var tbody = document.createElement("tbody");

    function addRow(label, value) {
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.textContent = label;
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    if (tipo === "ganaderias") {
        addRow("Corridas", statsItem.corridas != null ? statsItem.corridas : 0);
    }
    addRow("Toros", statsItem.toros != null ? statsItem.toros : 0);
    addRow("Orejas", statsItem.orejas != null ? statsItem.orejas : 0);
    addRow("Vueltas", statsItem.vueltas != null ? statsItem.vueltas : 0);
    addRow("Saludos", statsItem.saludos != null ? statsItem.saludos : 0);
    addRow("Palmas", statsItem.palmas != null ? statsItem.palmas : 0);
    addRow("Silencios", statsItem.silencios != null ? statsItem.silencios : 0);
    addRow("Pitos", statsItem.pitos != null ? statsItem.pitos : 0);
    addRow("Broncas", statsItem.broncas != null ? statsItem.broncas : 0);
    addRow("Avisos", statsItem.avisos != null ? statsItem.avisos : 0);

    table.appendChild(tbody);
    container.appendChild(table);

    var caption = document.getElementById("profile-stats-caption");
    if (caption) {
        var text = "Temporada: " + season;
        if (updatedAt) {
            text += " · Actualizado: " + updatedAt;
        }
        caption.textContent = text;
    }
}

function getTipoLabel(tipo) {
    if (tipo === "matadores") return "Matador";
    if (tipo === "novilleros") return "Novillero";
    if (tipo === "rejoneadores") return "Rejoneador";
    if (tipo === "ganaderias") return "Ganadería";
    return "";
}

function initSeasonButtons(id, tipo, perfil) {
    var buttons = document.querySelectorAll(".profile-season-btn");
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var season = btn.getAttribute("data-season") || "2026";
            buttons.forEach(function (b) { b.classList.remove("profile-season-btn--active"); });
            btn.classList.add("profile-season-btn--active");
            updateStatsForSeason(id, tipo, season, perfil);
            var url = new URL(window.location.href);
            url.searchParams.set("season", season);
            window.history.replaceState({}, "", url.toString());
            var back = document.getElementById("profile-back");
            if (back) {
                back.href = "estadisticas.html?type=" + encodeURIComponent(tipo) + "&season=" + encodeURIComponent(season);
            }
        });
    });
}

function updateStatsForSeason(id, tipo, season, perfil) {
    var container = document.getElementById("profile-stats-table");
    if (!container) return;
    container.innerHTML = "";
    var loading = document.createElement("p");
    loading.className = "stats-loading";
    loading.textContent = "Cargando estadísticas de la temporada " + season + "…";
    container.appendChild(loading);
    cargarTemporadaStats(season)
        .then(function (stats) {
            var list = stats[tipo] || [];
            var item = list.find(function (entry) { return entry.id === id; }) || null;
            var updatedAt = stats.updatedAt || "";
            var photoContainer = document.getElementById("profile-photo");
            if (photoContainer) {
                renderFotoPerfil(photoContainer, perfil, item);
            }
            renderStatsPerfil(container, tipo, item, season, updatedAt);
        })
        .catch(function () {
            container.innerHTML = "";
            var error = document.createElement("p");
            error.className = "stats-empty";
            error.textContent = "No se pudieron cargar las estadísticas de esta temporada.";
            container.appendChild(error);
        });
}

function initPerfilPage() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var tipo = params.get("type") || "";
    var season = params.get("season") || "2026";
    if (season !== "2025" && season !== "2026") {
        season = "2026";
    }
    var nameEl = document.getElementById("profile-name");
    var typeEl = document.getElementById("profile-type");
    var bioEl = document.getElementById("profile-bio");
    var linksEl = document.getElementById("profile-links");
    var backEl = document.getElementById("profile-back");

    var hasIdParam = params.has("id");
    var hasTypeParam = params.has("type");

    if (!hasIdParam || !hasTypeParam || !nameEl || !bioEl) {
        if (nameEl) {
            nameEl.textContent = "Perfil no disponible aún";
        }
        if (bioEl) {
            bioEl.textContent = "";
        }
        if (linksEl) {
            linksEl.innerHTML = "";
        }
        var statsSectionEarly = document.querySelector(".profile-stats");
        if (statsSectionEarly) {
            statsSectionEarly.style.display = "none";
        }
        return;
    }

    if (backEl) {
        backEl.href = "estadisticas.html?type=" + encodeURIComponent(tipo || "matadores") +
            "&season=" + encodeURIComponent(season);
    }

    var buttons = document.querySelectorAll(".profile-season-btn");
    buttons.forEach(function (btn) {
        if (btn.getAttribute("data-season") === season) {
            btn.classList.add("profile-season-btn--active");
        } else {
            btn.classList.remove("profile-season-btn--active");
        }
    });

    cargarPerfilBase(id)
        .then(function (perfil) {
            nameEl.textContent = perfil.nombre || "Perfil sin nombre";
            if (typeEl) {
                var t = tipo || perfil.tipo || "";
                typeEl.textContent = getTipoLabel(t);
            }
            if (bioEl) {
                bioEl.textContent = perfil.bio || "";
            }
            if (linksEl) {
                renderLinksPerfil(linksEl, perfil);
            }
            initSeasonButtons(id, tipo || perfil.tipo || "matadores", perfil);
            updateStatsForSeason(id, tipo || perfil.tipo || "matadores", season, perfil);
            document.title = (perfil.nombre || "Perfil") + " | Andanada del 5";
        })
        .catch(function () {
            nameEl.textContent = "Perfil no disponible aún";
            if (bioEl) {
                bioEl.textContent = "";
            }
            if (linksEl) {
                linksEl.innerHTML = "";
            }
            var statsSection = document.querySelector(".profile-stats");
            if (statsSection) {
                statsSection.style.display = "none";
            }
        });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPerfilPage);
} else {
    initPerfilPage();
}
