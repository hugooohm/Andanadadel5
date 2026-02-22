function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function formatDate(dateString) {
    if (!dateString) return "";
    var parts = String(dateString).split("-");
    if (parts.length !== 3) return dateString;
    var year = parts[0];
    var month = parts[1];
    var day = parts[2];
    return day + "/" + month + "/" + year;
}

function initGlobalMeta() {
    var headerDateEl = document.getElementById("header-date");
    var footerYearEl = document.getElementById("footer-year");
    var heroDateEl = document.getElementById("hero-date");

    var now = new Date();
    var formatter = new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    var formatted = formatter.format(now);

    if (headerDateEl) {
        headerDateEl.textContent = formatted;
    }
    if (heroDateEl) {
        heroDateEl.textContent = formatted;
    }
    if (footerYearEl) {
        footerYearEl.textContent = String(now.getFullYear());
    }
}

function highlightActiveNav() {
    var links = document.querySelectorAll(".site-nav__link");
    if (!links.length) return;
    var path = window.location.pathname || "";
    var file = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    var params = new URLSearchParams(window.location.search);
    var currentCat = params.get("cat") || "";

    links.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var url;
        try {
            url = new URL(href, window.location.origin);
        } catch (e) {
            return;
        }
        var linkPath = url.pathname || "";
        var linkFile = linkPath.substring(linkPath.lastIndexOf("/") + 1) || "index.html";
        var linkCat = url.searchParams.get("cat") || "";

        if (linkFile === file) {
            if (file === "category.html" && currentCat) {
                if (linkCat === currentCat) {
                    link.classList.add("site-nav__link--active");
                }
            } else {
                link.classList.add("site-nav__link--active");
            }
        }
    });
}

var PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><rect width='1200' height='800' fill='%23000000'/><rect x='48' y='56' width='1104' height='688' fill='none' stroke='%23ffffff' stroke-width='3' stroke-dasharray='8 8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif' font-size='32'>Imagen crónica taurina</text><rect x='48' y='720' width='200' height='4' fill='%23b00020'/></svg>";

function initNavToggle() {
    var toggleBtn = document.querySelector(".site-nav__toggle");
    var menu = document.getElementById("main-nav");
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        toggleBtn.classList.toggle("is-open", isOpen);
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
}

async function fetchIndex() {
    var response = await fetch("content/index.json", { cache: "no-cache" });
    if (!response.ok) {
        throw new Error("No se pudo cargar el índice de noticias");
    }
    var data = await response.json();
    if (Array.isArray(data)) {
        return data;
    }
    if (data && Array.isArray(data.posts)) {
        return data.posts;
    }
    return [];
}

var allPostsCache = null;
var configCache = null;

async function getAllPosts() {
    if (allPostsCache) return allPostsCache;
    var posts = await fetchIndex();
    allPostsCache = posts;
    return posts;
}

async function getConfig() {
    if (configCache) return configCache;
    try {
        var res = await fetch("config.json", { cache: "no-cache" });
        if (!res.ok) throw new Error("No config");
        var data = await res.json();
        configCache = data;
        return data;
    } catch (e) {
        configCache = {};
        return {};
    }
}
function createPostCard(post, options) {
    var featured = options && options.featured;
    var article = document.createElement("article");
    article.className = "post-card" + (featured ? " post-card--featured" : "");

    var link = document.createElement("a");
    link.className = "post-card__link";
    link.href = "post.html?slug=" + encodeURIComponent(post.slug || "");

    var media = document.createElement("div");
    media.className = "post-card__media post-card__media--ratio";

    var picture = document.createElement("picture");
    var img = document.createElement("img");
    img.className = "post-card__image";
    img.decoding = "async";

    var hasImage = post.image && String(post.image).trim() !== "";
    img.src = hasImage ? post.image : PLACEHOLDER_IMAGE;
    var altText = (post.imageAlt && String(post.imageAlt).trim() !== "")
        ? post.imageAlt
        : ((post.title && String(post.title).trim() !== "")
            ? ("Imagen del artículo: " + post.title)
            : "Imagen de Andanada del 5");
    img.alt = altText;
    img.sizes = featured ? "(min-width: 720px) 66vw, 100vw" : "(min-width: 720px) 33vw, 100vw";
    if (featured) {
        try { img.fetchPriority = "high"; } catch (e) {}
        img.loading = "eager";
    } else {
        img.loading = "lazy";
    }
    if (hasImage && Array.isArray(post.imageVariants) && post.imageVariants.length) {
        var srcset = buildSrcSet(post.image, post.imageVariants);
        if (srcset) img.srcset = srcset;
        if (post.webpEnabled) {
            var webpBase = replaceExt(post.image, ".webp");
            var webpSet = buildSrcSet(webpBase, post.imageVariants);
            if (webpSet) {
                var source = document.createElement("source");
                source.type = "image/webp";
                source.srcset = webpSet;
                picture.appendChild(source);
            }
        }
    }

    img.addEventListener("error", function () {
        img.src = PLACEHOLDER_IMAGE;
    });

    img.addEventListener("load", function () {
        img.classList.add("is-loaded");
    });

    picture.appendChild(img);
    media.appendChild(picture);
    link.appendChild(media);

    var body = document.createElement("div");
    body.className = "post-card__body";

    var categoryP = document.createElement("p");
    categoryP.className = "post-card__category";
    var badge = document.createElement("span");
    badge.className = "badge badge--category";
    badge.textContent = post.category || "";
    categoryP.appendChild(badge);

    var title = document.createElement("h2");
    title.className = "post-card__title";
    title.textContent = post.title || "";

    var meta = document.createElement("div");
    meta.className = "post-card__meta";

    var dateEl = document.createElement("time");
    dateEl.dateTime = post.date || "";
    dateEl.textContent = formatDate(post.date);
    meta.appendChild(dateEl);

    var excerpt = document.createElement("p");
    excerpt.className = "post-card__excerpt";
    excerpt.textContent = post.excerpt || "";

    body.appendChild(categoryP);
    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(excerpt);

    link.appendChild(body);
    article.appendChild(link);

    return article;
}

function createAgendaCard(item) {
    var article = document.createElement("article");
    article.className = "post-card agenda-card";
    var isSevilla = item.ciudad && String(item.ciudad).toLowerCase().indexOf("sevilla") !== -1;
    if (isSevilla) {
        article.className += " agenda-card--sevilla";
    }

    var wrapper = document.createElement("div");
    wrapper.className = "post-card__link";

    var media = document.createElement("div");
    media.className = "post-card__media post-card__media--ratio";

    var hasPoster = item.poster && String(item.poster).trim() !== "";
    if (hasPoster) {
        var picture = document.createElement("picture");
        var img = document.createElement("img");
        img.className = "post-card__image";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = item.poster;
        img.alt = item.titulo || "Cartel de la agenda taurina";
        picture.appendChild(img);
        media.appendChild(picture);
    } else {
        var placeholder = document.createElement("div");
        placeholder.className = "agenda-poster-placeholder";
        placeholder.textContent = isSevilla
            ? "Real Maestranza de Caballería de Sevilla"
            : "Las Ventas";
        media.appendChild(placeholder);
    }
    wrapper.appendChild(media);

    var body = document.createElement("div");
    body.className = "post-card__body";

    if (item.tipo) {
        var categoryP = document.createElement("p");
        categoryP.className = "post-card__category";
        var badge = document.createElement("span");
        badge.className = "badge badge--category agenda-badge";
        badge.textContent = item.tipo;
        categoryP.appendChild(badge);
        body.appendChild(categoryP);
    }

    var titleEl = document.createElement("h2");
    titleEl.className = "post-card__title";
    titleEl.textContent = item.titulo || "";
    body.appendChild(titleEl);

    var meta = document.createElement("div");
    meta.className = "post-card__meta agenda-meta";

    var dateEl = document.createElement("time");
    dateEl.dateTime = item.fecha || "";
    dateEl.textContent = formatDate(item.fecha);
    meta.appendChild(dateEl);

    if (item.hora) {
        var timeSpan = document.createElement("span");
        timeSpan.textContent = item.hora;
        meta.appendChild(timeSpan);
    }

    var locationParts = [];
    if (item.plaza) locationParts.push(item.plaza);
    if (item.ciudad) locationParts.push(item.ciudad);
    if (locationParts.length) {
        var locationSpan = document.createElement("span");
        locationSpan.textContent = locationParts.join(" · ");
        meta.appendChild(locationSpan);
    }

    body.appendChild(meta);

    wrapper.appendChild(body);
    article.appendChild(wrapper);

    var footer = document.createElement("div");
    footer.style.padding = "0 0.95rem 0.95rem";

    var hasUrl = item.buyUrl && String(item.buyUrl).trim() !== "";
    var cta = document.createElement("a");
    cta.className = "btn btn--accent agenda-btn";
    if (hasUrl) {
        cta.href = item.buyUrl;
        cta.target = "_blank";
        cta.rel = "noopener noreferrer";
        cta.textContent = item.buyText || "Comprar";
    } else {
        cta.href = "#";
        cta.textContent = "Próximamente";
        cta.setAttribute("aria-disabled", "true");
    }

    footer.appendChild(cta);
    article.appendChild(footer);

    return article;
}

function renderSkeletonCard() {
    var article = document.createElement("article");
    article.className = "post-card post-card--skeleton";

    var media = document.createElement("div");
    media.className = "post-card__media post-card__media--ratio skeleton skeleton-block";

    var body = document.createElement("div");
    body.className = "skeleton-card-body";

    var line1 = document.createElement("div");
    line1.className = "skeleton skeleton-line skeleton-line--short";

    var line2 = document.createElement("div");
    line2.className = "skeleton skeleton-line skeleton-line--medium";

    var line3 = document.createElement("div");
    line3.className = "skeleton skeleton-line skeleton-line--full";

    body.appendChild(line1);
    body.appendChild(line2);
    body.appendChild(line3);

    article.appendChild(media);
    article.appendChild(body);

    return article;
}

function fillGridWithSkeletons(container, count) {
    if (!container) return;
    container.innerHTML = "";
    for (var i = 0; i < count; i++) {
        container.appendChild(renderSkeletonCard());
    }
}

function buildVariantUrl(url, w) {
    var str = String(url || "");
    var m = str.match(/\.(jpg|jpeg|png|webp)$/i);
    if (!m) return "";
    var ext = m[0];
    var base = str.slice(0, -ext.length);
    return base + "@" + w + ext;
}

function buildSrcSet(url, variants) {
    if (!url || !Array.isArray(variants) || !variants.length) return "";
    var parts = [];
    for (var i = 0; i < variants.length; i++) {
        var w = variants[i];
        if (typeof w !== "number" || !w) continue;
        var vurl = buildVariantUrl(url, w);
        if (vurl) parts.push(vurl + " " + w + "w");
    }
    return parts.join(", ");
}

function replaceExt(url, newExt) {
    var str = String(url || "");
    var m = str.match(/\.(jpg|jpeg|png|webp)$/i);
    if (!m) return "";
    var ext = m[0];
    var base = str.slice(0, -ext.length);
    return base + newExt;
}

function setCanonical(url) {
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }
    link.setAttribute("href", url);
}

function renderShare(post, canonicalUrl) {
    var list = document.getElementById("post-share");
    if (!list) return;
    list.innerHTML = "";
    var xUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(post.title || "") + "&url=" + encodeURIComponent(canonicalUrl);
    var fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(canonicalUrl);

    var items = [
        { label: "X", href: xUrl },
        { label: "Facebook", href: fbUrl },
        { label: "Copiar enlace", href: "#copy" }
    ];
    items.forEach(function (it) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "share-chip";
        a.textContent = it.label;
        if (it.href === "#copy") {
            a.href = "#";
            a.addEventListener("click", function (e) {
                e.preventDefault();
                try {
                    navigator.clipboard.writeText(canonicalUrl);
                    a.textContent = "Enlace copiado";
                    setTimeout(function () { a.textContent = "Copiar enlace"; }, 2200);
                } catch (err) {}
            });
        } else {
            a.href = it.href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
        }
        li.appendChild(a);
        list.appendChild(li);
    });
}
var agendaCache = null;
var agendaPromise = null;

 
async function initHomePage() {
    var heroMain = document.getElementById("home-hero-main");
    var heroSide = document.getElementById("home-hero-side");
    var latestContainer = document.getElementById("latest-grid");
    var catActualidad = document.getElementById("home-cat-Actualidad");
    var catFerias = document.getElementById("home-cat-Ferias");
    var catCronicas = document.getElementById("home-cat-Crónicas");
    if (!heroMain || !heroSide || !latestContainer || !catActualidad || !catFerias || !catCronicas) return;

    heroMain.innerHTML = "";
    heroSide.innerHTML = "";
    latestContainer.innerHTML = "";
    catActualidad.innerHTML = "";
    catFerias.innerHTML = "";
    catCronicas.innerHTML = "";

    var mainSkeleton = renderSkeletonCard();
    var sideSkeleton1 = renderSkeletonCard();
    var sideSkeleton2 = renderSkeletonCard();
    heroMain.setAttribute("aria-busy", "true");
    heroMain.appendChild(mainSkeleton);
    heroSide.appendChild(sideSkeleton1);
    heroSide.appendChild(sideSkeleton2);

    fillGridWithSkeletons(latestContainer, 6);
    fillGridWithSkeletons(catActualidad, 3);
    fillGridWithSkeletons(catFerias, 3);
    fillGridWithSkeletons(catCronicas, 3);
    latestContainer.setAttribute("aria-busy", "true");
    catActualidad.setAttribute("aria-busy", "true");
    catFerias.setAttribute("aria-busy", "true");
    catCronicas.setAttribute("aria-busy", "true");

    try {
        var posts = await getAllPosts();
        posts.sort(function (a, b) {
            if (!a.date || !b.date) return 0;
            return a.date < b.date ? 1 : -1;
        });

        var heroUsedSlugs = renderHero(posts, heroMain, heroSide);
        heroMain.removeAttribute("aria-busy");
        heroSide.removeAttribute("aria-busy");
        var latestPosts = posts.filter(function (p) { return heroUsedSlugs.indexOf(p.slug) === -1; }).slice(0, 6);

        latestContainer.innerHTML = "";

        latestPosts.forEach(function (post) {
            var card = createPostCard(post, { featured: false });
            latestContainer.appendChild(card);
        });
        latestContainer.removeAttribute("aria-busy");

        renderCategorySection(posts, "Actualidad", 3, catActualidad);
        renderCategorySection(posts, "Ferias", 3, catFerias);
        renderCategorySection(posts, "Crónicas", 3, catCronicas);

        if (!latestPosts.length) {
            var empty = document.createElement("p");
            empty.textContent = "No hay noticias disponibles todavía.";
            latestContainer.appendChild(empty);
        }
        var mainImg = document.querySelector(".home-hero__main .post-card__image");
        if (mainImg && mainImg.src) {
            var link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            link.href = mainImg.src;
            document.head.appendChild(link);
        }
        setCanonical("https://andanadadel5.com/");
    } catch (error) {
        console.error(error);
        latestContainer.innerHTML = "<p>Ha habido un problema al cargar las noticias.</p>";
        latestContainer.removeAttribute("aria-busy");
        catActualidad.removeAttribute("aria-busy");
        catFerias.removeAttribute("aria-busy");
        catCronicas.removeAttribute("aria-busy");
    }
}

function getExcerpt(post) {
    if (post.excerpt && String(post.excerpt).trim() !== "") return post.excerpt;
    if (post.contentHtml && String(post.contentHtml).trim() !== "") {
        var tmp = document.createElement("div");
        tmp.innerHTML = post.contentHtml;
        var text = tmp.textContent || tmp.innerText || "";
        return text.slice(0, 160).trim();
    }
    return "";
}

function setPageMeta(_ref) {
    var title = _ref.title, description = _ref.description, url = _ref.url, image = _ref.image, _ref$type = _ref.type, type = _ref$type === void 0 ? "article" : _ref$type;
    var siteUrl = "https://andanadadel5.com";

    var absoluteImage = image && image.startsWith("http")
        ? image
        : siteUrl + (image || "/media/img/logoblanco.png");

    document.title = title;
    var titleEl = document.getElementById("meta-title");
    if (titleEl) titleEl.textContent = title;

    var descEl = document.getElementById("meta-description");
    if (descEl) descEl.setAttribute("content", description);

    var canonicalEl = document.getElementById("canonical-link");
    if (canonicalEl) canonicalEl.setAttribute("href", url);

    var ogTitleEl = document.getElementById("meta-og-title");
    if (ogTitleEl) ogTitleEl.setAttribute("content", title);

    var ogDescEl = document.getElementById("meta-og-description");
    if (ogDescEl) ogDescEl.setAttribute("content", description);

    var ogTypeEl = document.getElementById("meta-og-type");
    if (ogTypeEl) ogTypeEl.setAttribute("content", type);

    var ogUrlEl = document.getElementById("meta-og-url");
    if (ogUrlEl) ogUrlEl.setAttribute("content", url);

    var ogImageEl = document.getElementById("meta-og-image");
    if (ogImageEl) ogImageEl.setAttribute("content", absoluteImage);

    var twTitleEl = document.getElementById("meta-twitter-title");
    if (twTitleEl) twTitleEl.setAttribute("content", title);

    var twDescEl = document.getElementById("meta-twitter-description");
    if (twDescEl) twDescEl.setAttribute("content", description);

    var twImageEl = document.getElementById("meta-twitter-image");
    if (twImageEl) twImageEl.setAttribute("content", absoluteImage);
}

function getPageName() {
    var path = window.location.pathname || "";
    var file = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    return file.toLowerCase();
}

function matchesQuery(post, query) {
    var q = String(query || "").toLowerCase().trim();
    if (!q) return false;
    var parts = q.split(/\s+/).filter(function (p) { return p; });
    if (!parts.length) return false;

    var keywords = "";
    if (Array.isArray(post.keywords)) {
        keywords = post.keywords.join(" ");
    } else if (post.keywords) {
        keywords = String(post.keywords);
    }

    var haystack = [
        post.title,
        post.excerpt,
        post.category,
        keywords
    ]
        .filter(function (v) { return v && String(v).trim() !== ""; })
        .join(" ")
        .toLowerCase();

    if (!haystack) return false;

    return parts.every(function (term) {
        return haystack.indexOf(term) !== -1;
    });
}

function classifyPost(post) {
    var baseCategory = post.category || "";
    if (baseCategory && String(baseCategory).trim() !== "") return baseCategory;

    var tags = Array.isArray(post.tags) ? post.tags : [];
    var map = {
        "Feria de San Isidro": "Ferias",
        "Feria de Abril": "Ferias",
        "Feria del Pilar": "Ferias",
        "Ferias": "Ferias",
        "Las Ventas": "Plazas",
        "Maestranza": "Plazas",
        "Plazas": "Plazas",
        "Actualidad": "Actualidad",
        "Crónicas": "Crónicas",
        "Opinión": "Opinión",
        "Entrevista": "Opinión",
        "Entrevistas": "Opinión",
        "Festejo Popular": "Festejo Popular",
        "festejo popular": "Festejo Popular",
        "festejo-popular": "Festejo Popular"
    };
    for (var i = 0; i < tags.length; i++) {
        var t = String(tags[i] || "");
        for (var key in map) {
            if (!map.hasOwnProperty(key)) continue;
            if (t.indexOf(key) !== -1) {
                return map[key];
            }
        }
    }
    return baseCategory || "";
}

function renderHero(posts, heroMain, heroSide) {
    function compareHero(a, b) {
        var pa = typeof a.priority === "number" ? a.priority : 0;
        var pb = typeof b.priority === "number" ? b.priority : 0;
        if (pa !== pb) {
            return pb - pa;
        }
        if (!a.date || !b.date) return 0;
        return a.date < b.date ? 1 : -1;
    }

    var featured = posts.filter(function (p) { return !!p.featured; });
    var heroSource = featured.length ? featured.slice().sort(compareHero) : posts;
    var used = [];
    var mainPost = heroSource[0];
    if (mainPost) {
        used.push(mainPost.slug);
        heroMain.innerHTML = "";
        var mainCard = createPostCard(Object.assign({}, mainPost, { excerpt: getExcerpt(mainPost) }), { featured: true });
        heroMain.appendChild(mainCard);
    }
    var sideCandidates = heroSource.slice(1);
    heroSide.innerHTML = "";
    sideCandidates.slice(0, 2).forEach(function (p) {
        used.push(p.slug);
        var card = createPostCard(Object.assign({}, p, { excerpt: getExcerpt(p) }), { featured: false });
        heroSide.appendChild(card);
    });
    return used;
}

function renderCategorySection(posts, categoryName, limit, containerEl) {
    if (!containerEl) return;
    var items = posts.filter(function (p) { return classifyPost(p) === categoryName; }).slice(0, limit);
    containerEl.innerHTML = "";
    items.forEach(function (p) {
        var card = createPostCard(Object.assign({}, p, { excerpt: getExcerpt(p) }), { featured: false });
        containerEl.appendChild(card);
    });
    containerEl.removeAttribute("aria-busy");
}

function initSearch() {
    var searchBtn = document.querySelector(".site-nav__search-btn");
    if (!searchBtn) return;

    var pageType = document.body.getAttribute("data-page");
    if (pageType !== "home") {
        searchBtn.addEventListener("click", function () {
            window.location.href = "index.html#search";
        });
        return;
    }

    var section = document.getElementById("search-section");
    var form = document.getElementById("search-form");
    var input = document.getElementById("search-input");
    var resultsEl = document.getElementById("search-results");
    var feedbackEl = document.getElementById("search-feedback");

    if (!section || !form || !input || !resultsEl) return;

    function openPanel() {
        section.hidden = false;
        section.classList.add("search-section--visible");
        input.focus();
    }

    searchBtn.addEventListener("click", function () {
        openPanel();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        runSearch(input.value);
    });

    var debounceTimer = null;
    input.addEventListener("input", function () {
        var value = input.value;
        clearTimeout(debounceTimer);
        if (!value || value.trim().length < 2) {
            resultsEl.innerHTML = "";
            if (feedbackEl) feedbackEl.textContent = "";
            return;
        }
        debounceTimer = setTimeout(function () {
            runSearch(value);
        }, 180);
    });

    async function runSearch(query) {
        var trimmed = String(query || "").trim();
        if (!trimmed) {
            resultsEl.innerHTML = "";
            if (feedbackEl) feedbackEl.textContent = "";
            return;
        }

        try {
            var posts = await getAllPosts();
            var matched = posts.filter(function (post) {
                return matchesQuery(post, trimmed);
            });

            resultsEl.innerHTML = "";
            matched.forEach(function (post) {
                var card = createPostCard(post, { featured: false });
                resultsEl.appendChild(card);
            });

            if (feedbackEl) {
                feedbackEl.textContent = matched.length
                    ? "Resultados para “" + trimmed + "” (" + matched.length + ")"
                    : "No se han encontrado resultados para “" + trimmed + "”.";
            }
        } catch (error) {
            console.error(error);
            if (feedbackEl) {
                feedbackEl.textContent = "Ha habido un problema al buscar en los artículos.";
            }
        }
    }

    if (window.location.hash === "#search") {
        openPanel();
    }
}

async function fetchPostBySlug(slug) {
    var response = await fetch("content/posts/" + encodeURIComponent(slug) + ".json", { cache: "no-cache" });
    if (!response.ok) {
        throw new Error("No se pudo cargar la noticia solicitada");
    }
    return response.json();
}

async function initPostPage() {
    var slug = getQueryParam("slug");
    var titleEl = document.getElementById("post-title");
    var categoryEl = document.getElementById("post-category");
    var dateEl = document.getElementById("post-date");
    var bylineEl = document.getElementById("post-byline");
    var imageEl = document.getElementById("post-image");
    var imageCaptionEl = document.getElementById("post-image-caption");
    var mediaSection = document.getElementById("post-media-section");
    var contentEl = document.getElementById("post-content");
    var tagsSectionEl = document.getElementById("post-tags-section");
    var tagsListEl = document.getElementById("post-tags");

    if (!slug || !titleEl || !contentEl) {
        if (contentEl) {
            contentEl.textContent = "No se ha encontrado la noticia solicitada.";
        }
        return;
    }

    if (contentEl) {
        contentEl.innerHTML = "";
        for (var i = 0; i < 4; i++) {
            var line = document.createElement("div");
            line.className = "skeleton skeleton-line skeleton-line--full";
            contentEl.appendChild(line);
        }
        contentEl.setAttribute("aria-busy", "true");
    }

    try {
        var allPosts = await fetchIndex();
        var meta = allPosts.find(function (item) {
            return item.slug === slug;
        });
        if (!meta) {
            contentEl.textContent = "No se ha encontrado la noticia solicitada.";
            return;
        }

        var post = meta;
        if (!post.contentHtml) {
            try {
                var detailed = await fetchPostBySlug(slug);
                post = Object.assign({}, meta, detailed);
            } catch (e) {
                post = meta;
            }
        }

        titleEl.textContent = post.title || "";

        if (categoryEl) {
            categoryEl.textContent = post.category || "";
        }

        if (dateEl) {
            dateEl.textContent = formatDate(post.date);
            dateEl.dateTime = post.date || "";
        }

        var rawAuthor = "";
        if (post.author && String(post.author).trim() !== "") {
            rawAuthor = String(post.author).trim();
        } else if (post.autor && String(post.autor).trim() !== "") {
            rawAuthor = String(post.autor).trim();
        } else if (post.writer && String(post.writer).trim() !== "") {
            rawAuthor = String(post.writer).trim();
        }
        var author = rawAuthor || "Redacción Andanada del 5";

        if (bylineEl) {
            if (author === "Redacción Andanada del 5") {
                bylineEl.textContent = "Por Redacción Andanada del 5";
            } else {
                bylineEl.textContent = "Por " + author + " del medio Andanada del 5";
            }
        }

        if (imageEl && mediaSection) {
            var hasImage = post.image && String(post.image).trim() !== "";
            var newPicture = document.createElement("picture");
            var newImg = document.createElement("img");
            newImg.id = imageEl.id || "post-image";
            newImg.className = imageEl.className || "";
            newImg.loading = "lazy";
            newImg.decoding = "async";
            newImg.src = hasImage ? post.image : PLACEHOLDER_IMAGE;
            var altTextPost = post.title && String(post.title).trim() !== ""
                ? post.title
                : "Imagen de Andanada del 5";
            newImg.alt = altTextPost;
            newImg.setAttribute("width", "760");
            newImg.setAttribute("height", "420");
            newImg.sizes = "(min-width: 900px) 760px, 100vw";
            try { newImg.fetchPriority = "high"; } catch (e) {}
            if (hasImage && Array.isArray(post.imageVariants) && post.imageVariants.length) {
                var srcsetPost = buildSrcSet(post.image, post.imageVariants);
                if (srcsetPost) newImg.srcset = srcsetPost;
                if (post.webpEnabled) {
                    var webpBasePost = replaceExt(post.image, ".webp");
                    var webpSetPost = buildSrcSet(webpBasePost, post.imageVariants);
                    if (webpSetPost) {
                        var sourcePost = document.createElement("source");
                        sourcePost.type = "image/webp";
                        sourcePost.srcset = webpSetPost;
                        newPicture.appendChild(sourcePost);
                    }
                }
            }
            newImg.addEventListener("error", function () {
                newImg.src = PLACEHOLDER_IMAGE;
            });
            newPicture.appendChild(newImg);
            if (imageEl.parentNode) {
                imageEl.parentNode.replaceChild(newPicture, imageEl);
            } else {
                mediaSection.innerHTML = "";
                mediaSection.appendChild(newPicture);
            }
            imageEl = newImg;
            imageEl.addEventListener("error", function () {
                imageEl.src = PLACEHOLDER_IMAGE;
            });
            mediaSection.hidden = false;
        }

        if (imageCaptionEl && post.imageCaption) {
            imageCaptionEl.textContent = post.imageCaption;
        }

        if (contentEl && post.contentHtml) {
            contentEl.innerHTML = post.contentHtml;
            contentEl.removeAttribute("aria-busy");
        }

        var authorMeta = document.querySelector('meta[name="author"]');
        if (!authorMeta) {
            authorMeta = document.createElement("meta");
            authorMeta.setAttribute("name", "author");
            document.head.appendChild(authorMeta);
        }
        authorMeta.setAttribute("content", author === "Redacción Andanada del 5" ? "Andanada del 5" : author);

        var head = document.head;
        var siteUrlMeta = "https://andanadadel5.com";
        var canonicalUrl = siteUrlMeta + "/post.html?slug=" + encodeURIComponent(slug);

        var baseDescription = "";
        if (post.excerpt && String(post.excerpt).trim() !== "") {
            baseDescription = String(post.excerpt).trim();
        } else if (post.content) {
            baseDescription = String(post.content).replace(/<[^>]*>?/gm, "").slice(0, 160);
        } else {
            baseDescription = getExcerpt(post);
        }
        var description = baseDescription || "Crónicas, análisis y actualidad taurina.";

        var socialImage = post.socialImage && String(post.socialImage).trim() !== ""
            ? post.socialImage
            : (post.image && String(post.image).trim() !== "" ? post.image : "/media/img/logoblanco.png");

        var fullTitle = (post.title || "Artículo") + " | Andanada del 5";

        setPageMeta({
            title: fullTitle,
            description: description,
            url: canonicalUrl,
            image: socialImage,
            type: "article"
        });

        var schemaAuthor;
        if (author === "Redacción Andanada del 5") {
            schemaAuthor = {
                "@type": "Organization",
                "name": "Andanada del 5"
            };
        } else {
            schemaAuthor = {
                "@type": "Person",
                "name": author
            };
        }

        var ldJson = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title || "",
            "datePublished": post.date || "",
            "dateModified": post.date || "",
            "author": schemaAuthor,
            "publisher": {
                "@type": "Organization",
                "name": "Andanada del 5",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://andanadadel5.com/media/img/logoblanco.png"
                }
            },
            "image": socialImage,
            "articleSection": post.category || "",
            "description": description || "",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
            }
        };

        var ldScript = document.createElement("script");
        ldScript.type = "application/ld+json";
        ldScript.textContent = JSON.stringify(ldJson);
        head.appendChild(ldScript);

        var breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://andanadadel5.com/" },
                { "@type": "ListItem", "position": 2, "name": post.category || "Noticias", "item": "https://andanadadel5.com/category.html?cat=" + encodeURIComponent(post.category || "") },
                { "@type": "ListItem", "position": 3, "name": post.title || "", "item": canonicalUrl }
            ]
        };
        var existingBreadcrumb = document.querySelector('script[type="application/ld+json"][data-schema="breadcrumb"]');
        if (existingBreadcrumb && existingBreadcrumb.parentNode) {
            existingBreadcrumb.parentNode.removeChild(existingBreadcrumb);
        }
        var bcScript = document.createElement("script");
        bcScript.type = "application/ld+json";
        bcScript.setAttribute("data-schema", "breadcrumb");
        bcScript.textContent = JSON.stringify(breadcrumb);
        head.appendChild(bcScript);

        setCanonical(canonicalUrl);
        renderShare(post, canonicalUrl);
        var prevEl = document.getElementById("post-prev");
        var nextEl = document.getElementById("post-next");
        if (prevEl && nextEl && Array.isArray(allPosts) && allPosts.length) {
            var sorted = allPosts.slice().sort(function (a, b) {
                if (!a.date || !b.date) return 0;
                return a.date < b.date ? 1 : -1;
            });
            var idx = sorted.findIndex(function (p) { return p.slug === slug; });
            var newer = idx > 0 ? sorted[idx - 1] : null;
            var older = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
            var sameCategory = sorted.filter(function (p) { return classifyPost(p) === classifyPost(post); });
            var idxSame = sameCategory.findIndex(function (p) { return p.slug === slug; });
            if (idxSame !== -1) {
                var newerSame = idxSame > 0 ? sameCategory[idxSame - 1] : null;
                var olderSame = idxSame >= 0 && idxSame < sameCategory.length - 1 ? sameCategory[idxSame + 1] : null;
                if (olderSame) older = olderSame;
                if (newerSame) newer = newerSame;
            }
            if (older && older.slug) {
                prevEl.href = "post.html?slug=" + encodeURIComponent(older.slug);
                prevEl.textContent = "Anterior en " + (classifyPost(older) || "Sección") + ": " + (older.title || "");
                prevEl.hidden = false;
                var linkPrev = document.querySelector('link[rel="prev"]') || document.createElement("link");
                linkPrev.setAttribute("rel", "prev");
                linkPrev.setAttribute("href", "https://andanadadel5.com/post.html?slug=" + encodeURIComponent(older.slug));
                document.head.appendChild(linkPrev);
            }
            if (newer && newer.slug) {
                nextEl.href = "post.html?slug=" + encodeURIComponent(newer.slug);
                nextEl.textContent = "Siguiente en " + (classifyPost(newer) || "Sección") + ": " + (newer.title || "");
                nextEl.hidden = false;
                var linkNext = document.querySelector('link[rel="next"]') || document.createElement("link");
                linkNext.setAttribute("rel", "next");
                linkNext.setAttribute("href", "https://andanadadel5.com/post.html?slug=" + encodeURIComponent(newer.slug));
                document.head.appendChild(linkNext);
            }
        }
        if (tagsSectionEl && tagsListEl && Array.isArray(post.tags) && post.tags.length) {
            tagsListEl.innerHTML = "";
            post.tags.forEach(function (tag) {
                var li = document.createElement("li");
                li.className = "tag-list__item";
                var chip = document.createElement("span");
                chip.className = "tag-chip";
                chip.textContent = tag;
                li.appendChild(chip);
                tagsListEl.appendChild(li);
            });
            tagsSectionEl.hidden = false;
        }
    } catch (error) {
        console.error(error);
        contentEl.textContent = "Ha habido un problema al cargar la noticia.";
        contentEl.removeAttribute("aria-busy");
    }
}

async function initCategoryPage() {
    var categoryParam = getQueryParam("cat");
    var titleEl = document.getElementById("category-title");
    var labelEl = document.getElementById("category-label");
    var descriptionEl = document.getElementById("category-description");
    var indexEl = document.getElementById("category-index");
    var listEl = document.getElementById("category-posts");
    if (!titleEl || !listEl) return;

    fillGridWithSkeletons(listEl, 6);
    listEl.setAttribute("aria-busy", "true");

    var categoryName = categoryParam || "Todas las secciones";
    titleEl.textContent = categoryName;
    if (labelEl) {
        labelEl.textContent = categoryParam || "Todas";
    }

    if (indexEl) {
        indexEl.innerHTML = "";
    }

    var CATEGORY_INDEX = {
        Actualidad: {
            description: "Noticias inmediatas de lo que pasa en los ruedos y despachos.",
            items: [
                "Suspensiones",
                "Comunicados oficiales",
                "Cambios de carteles"
            ]
        },
        Ferias: {
            description: "Cobertura de las grandes ferias y ciclos taurinos.",
            items: [
                "Feria de San Isidro",
                "Feria de Abril",
                "Feria del Pilar",
                "Ferias de Francia y América"
            ]
        },
        "Festejo Popular": {
            description: "Cobertura específica de los festejos populares y su contexto.",
            items: [
                "Crónicas de festejos populares",
                "Análisis del entorno social y cultural",
                "Programas y carteles destacados"
            ]
        },
        Crónicas: {
            description: "Relato y análisis de lo que ha ocurrido en cada tarde.",
            items: [
                "Resúmenes de corridas",
                "Análisis artístico y técnico",
                "Opinión fundamentada"
            ]
        },
        Toreros: {
            description: "Perfiles y actualidad de quienes se ponen delante del toro.",
            items: [
                "Figuras",
                "Jóvenes promesas",
                "Entrevistas"
            ]
        },
        Ganaderías: {
            description: "El campo bravo y las casas ganaderas más relevantes.",
            items: [
                "Historia",
                "Encastes",
                "Resultados en plazas"
            ]
        },
        Plazas: {
            description: "Los escenarios donde se escribe la temporada.",
            items: [
                "Plaza de Toros de Las Ventas",
                "Plaza de Toros de la Maestranza",
                "Plazas de segunda y tercera categoría"
            ]
        },
        Opinión: {
            description: "Miradas personales y criterio sobre la actualidad taurina.",
            items: [
                "Artículos editoriales",
                "Columnas fijas"
            ]
        },
        Agenda: {
            description: "Todo lo que viene: carteles, fechas y cómo ir a la plaza.",
            items: [
                "Carteles",
                "Fechas",
                "Venta de entradas (enlaces externos)"
            ]
        }
    };

    var categoryConfig = categoryParam && CATEGORY_INDEX[categoryParam] ? CATEGORY_INDEX[categoryParam] : null;

    if (descriptionEl) {
        if (categoryConfig) {
            descriptionEl.textContent = categoryConfig.description;
        } else {
            descriptionEl.textContent = categoryParam
                ? "Selección de artículos de la sección de " + categoryName + "."
                : "Selección de artículos de todas las secciones.";
        }
    }

    if (categoryConfig && indexEl) {
        categoryConfig.items.forEach(function (label) {
            var li = document.createElement("li");
            li.className = "category-index__item";

            var bullet = document.createElement("span");
            bullet.className = "category-index__bullet";
            bullet.textContent = "•";

            var text = document.createElement("span");
            text.className = "category-index__label";
            text.textContent = label;

            li.appendChild(bullet);
            li.appendChild(text);
            indexEl.appendChild(li);
        });
    }

    try {
        var posts = await fetchIndex();
        var filtered = categoryParam
            ? posts.filter(function (post) {
                  return classifyPost(post) === categoryParam;
              })
            : posts;

        listEl.innerHTML = "";

        filtered.forEach(function (post) {
            var card = createPostCard(post, { featured: false });
            listEl.appendChild(card);
        });
        listEl.removeAttribute("aria-busy");

        if (!filtered.length) {
            var empty = document.createElement("p");
            empty.textContent = "Todavía no hay artículos publicados en esta categoría.";
            listEl.appendChild(empty);
        }
        var url = "https://andanadadel5.com/category.html" + (categoryParam ? ("?cat=" + encodeURIComponent(categoryParam)) : "");
        setCanonical(url);
    } catch (error) {
        console.error(error);
        listEl.innerHTML = "<p>Ha habido un problema al cargar las noticias.</p>";
        listEl.removeAttribute("aria-busy");
    }
}

async function initTagPage() {
    var tagParam = getQueryParam("tag");
    var titleEl = document.getElementById("tag-title");
    var descriptionEl = document.getElementById("tag-description");
    var listEl = document.getElementById("tag-posts");
    var emptyEl = document.getElementById("tag-empty");

    if (!titleEl || !listEl) return;

    fillGridWithSkeletons(listEl, 6);
    listEl.setAttribute("aria-busy", "true");

    var tagName = tagParam || "Todos los tags";
    titleEl.textContent = tagName;

    if (descriptionEl) {
        if (tagParam) {
            descriptionEl.textContent = "Artículos relacionados con “" + tagName + "”.";
        } else {
            descriptionEl.textContent = "Selección de artículos etiquetados en la Andanada del 5.";
        }
    }

    try {
        var posts = await fetchIndex();
        var filtered = tagParam
            ? posts.filter(function (post) {
                  if (!Array.isArray(post.tags)) return false;
                  return post.tags.indexOf(tagParam) !== -1;
              })
            : posts;

        listEl.innerHTML = "";

        filtered.forEach(function (post) {
            var card = createPostCard(post, { featured: false });
            listEl.appendChild(card);
        });
        listEl.removeAttribute("aria-busy");

        if (emptyEl) {
            emptyEl.hidden = filtered.length > 0;
        }

        if (!filtered.length && !emptyEl) {
            var fallback = document.createElement("p");
            fallback.textContent = "Todavía no hay artículos para este tag.";
            listEl.appendChild(fallback);
        }
        var url = "https://andanadadel5.com/tag.html" + (tagParam ? ("?tag=" + encodeURIComponent(tagParam)) : "");
        setCanonical(url);
    } catch (error) {
        console.error(error);
        listEl.innerHTML = "<p>Ha habido un problema al cargar las noticias.</p>";
        listEl.removeAttribute("aria-busy");
    }
}

function initNewsletter() {
    var forms = document.querySelectorAll(".newsletter__form");
    getConfig().then(function (cfg) {
        var username = cfg && cfg.buttondownUsername ? String(cfg.buttondownUsername).trim() : "";
        var endpoint = username ? ("https://buttondown.com/api/emails/embed-subscribe/" + encodeURIComponent(username)) : null;
        forms.forEach(function (newsletterForm) {
            if (endpoint) {
                newsletterForm.setAttribute("action", endpoint);
            }
        newsletterForm.addEventListener("submit", function (event) {
            event.preventDefault();
            var emailInput = newsletterForm.querySelector('input[type="email"]');
            var feedback = newsletterForm.querySelector(".newsletter__feedback");
            if (!emailInput || !feedback) {
                return;
            }
            feedback.textContent = "";
            if (!emailInput.checkValidity()) {
                emailInput.reportValidity();
                return;
            }

            var action = newsletterForm.getAttribute("action");
            if (!action) {
                return;
            }

            var formData = new FormData(newsletterForm);
            if (!formData.get("embed")) {
                formData.set("embed", "1");
            }

            emailInput.disabled = true;

            fetch(action, {
                method: "POST",
                mode: "no-cors",
                body: formData
            }).then(function () {
                emailInput.value = "";
                feedback.textContent = "Gracias por suscribirte. Revisa tu correo para confirmar la suscripción.";
            }).catch(function () {
                feedback.textContent = "No hemos podido procesar tu suscripción. Inténtalo de nuevo en unos minutos.";
            }).finally(function () {
                emailInput.disabled = false;
            });
        });
        });
    });
}

function initScrollTop() {
    var btn = document.querySelector(".scroll-top");
    if (!btn) return;

    function onScroll() {
        if (window.scrollY > 240) {
            btn.classList.add("scroll-top--visible");
        } else {
            btn.classList.remove("scroll-top--visible");
        }
    }

    window.addEventListener("scroll", onScroll);

    btn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    onScroll();
}

function initServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js");
    }
}

async function initArchivePage() {
    var listEl = document.getElementById("archive-posts");
    if (!listEl) return;
    fillGridWithSkeletons(listEl, 9);
    listEl.setAttribute("aria-busy", "true");
    try {
        var posts = await fetchIndex();
        posts.sort(function (a, b) {
            if (!a.date || !b.date) return 0;
            return a.date < b.date ? 1 : -1;
        });
        listEl.innerHTML = "";
        posts.forEach(function (post) {
            var card = createPostCard(post, { featured: false });
            listEl.appendChild(card);
        });
        listEl.removeAttribute("aria-busy");
        setCanonical("https://andanadadel5.com/archive.html");
    } catch (error) {
        console.error(error);
        listEl.innerHTML = "<p>Ha habido un problema al cargar las noticias.</p>";
        listEl.removeAttribute("aria-busy");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    initGlobalMeta();
    initNavToggle();
    highlightActiveNav();

    var pageType = document.body.getAttribute("data-page");
    if (pageType === "home") {
        initHomePage();
    } else if (pageType === "post") {
        initPostPage();
    } else if (pageType === "category") {
        initCategoryPage();
    } else if (pageType === "tag") {
        initTagPage();
    } else if (pageType === "archive") {
        initArchivePage();
    } else if (pageType === "agenda") {
        loadAgenda();
    }

    initNewsletter();
    initSearch();
    initScrollTop();
    initServiceWorker();
});

document.addEventListener("DOMContentLoaded", function () {
    var page = getPageName();
    if (page === "post.html") return;

    var hasMeta =
        document.getElementById("meta-title") &&
        document.getElementById("meta-description") &&
        document.getElementById("canonical-link") &&
        document.getElementById("meta-og-title") &&
        document.getElementById("meta-og-description") &&
        document.getElementById("meta-og-type") &&
        document.getElementById("meta-og-url") &&
        document.getElementById("meta-og-image") &&
        document.getElementById("meta-twitter-title") &&
        document.getElementById("meta-twitter-description") &&
        document.getElementById("meta-twitter-image");

    if (!hasMeta) return;

    var siteUrl = "https://andanadadel5.com";
    var logo = siteUrl + "/media/img/logoblanco.png";

    if (page === "index.html") {
        setPageMeta({
            title: "Andanada del 5 | Medio taurino digital",
            description: "Crónicas, análisis y actualidad taurina. Ferias, carteles, agenda y estadísticas.",
            url: siteUrl + "/",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "category.html") {
        var cat = getQueryParam("cat") || "Categoría";
        var catUrl = siteUrl + "/category.html" + (cat ? ("?cat=" + encodeURIComponent(cat)) : "");
        setPageMeta({
            title: cat + " | Andanada del 5",
            description: "Últimas noticias de " + cat + " en Andanada del 5. Crónicas, análisis y actualidad taurina.",
            url: catUrl,
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "tag.html") {
        var tag = getQueryParam("tag") || "Tag";
        var tagUrl = siteUrl + "/tag.html" + (tag ? ("?tag=" + encodeURIComponent(tag)) : "");
        setPageMeta({
            title: tag + " | Andanada del 5",
            description: "Artículos relacionados con " + tag + " en Andanada del 5.",
            url: tagUrl,
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "archive.html") {
        setPageMeta({
            title: "Archivo | Andanada del 5",
            description: "Listado cronológico de todas las publicaciones de Andanada del 5.",
            url: siteUrl + "/archive.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "agenda.html") {
        setPageMeta({
            title: "Agenda taurina | Andanada del 5",
            description: "Próximos festejos y carteles en Las Ventas y La Maestranza.",
            url: siteUrl + "/agenda.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "estadisticas.html") {
        setPageMeta({
            title: "Estadísticas | Andanada del 5",
            description: "Estadísticas de matadores, novilleros, rejoneadores y ganaderías por temporada.",
            url: siteUrl + "/estadisticas.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "perfil.html") {
        setPageMeta({
            title: "Perfil | Andanada del 5",
            description: "Ficha y estadísticas de la temporada para profesionales y ganaderías.",
            url: siteUrl + "/perfil.html",
            image: logo,
            type: "profile"
        });
        return;
    }

    if (page === "aviso-legal.html") {
        setPageMeta({
            title: "Aviso legal | Andanada del 5",
            description: "Aviso legal: información del titular, condiciones de uso y responsabilidad.",
            url: siteUrl + "/aviso-legal.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "privacidad.html") {
        setPageMeta({
            title: "Política de privacidad | Andanada del 5",
            description: "Política de privacidad: tratamiento de datos personales y derechos.",
            url: siteUrl + "/privacidad.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "cookies.html") {
        setPageMeta({
            title: "Política de cookies | Andanada del 5",
            description: "Política de cookies: qué son, tipos y cómo gestionarlas.",
            url: siteUrl + "/cookies.html",
            image: logo,
            type: "website"
        });
        return;
    }

    if (page === "contacto.html") {
        setPageMeta({
            title: "Contacto | Andanada del 5",
            description: "Contacto para prensa, colaboraciones o sugerencias.",
            url: siteUrl + "/contacto.html",
            image: logo,
            type: "website"
        });
    }
});

async function loadAgenda() {
  try {
    const response = await fetch("./content/agenda/agenda.json");
    if (!response.ok) throw new Error("No se pudo cargar agenda.json");

    const data = await response.json();

    const sorted = Array.isArray(data)
      ? [...data].sort(
          (a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0)
        )
      : [];

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let featuredEvent =
      sorted.find((e) => e.fecha && e.fecha >= todayStr) || sorted[0] || null;

    const agendaContainer = document.getElementById("agenda-container");
    const agendaFeatured = document.getElementById("agenda-featured");
    const agendaQuick = document.getElementById("agenda-quick");

    if (agendaFeatured && featuredEvent) renderAgendaFeatured(featuredEvent);
    if (agendaContainer) renderAgendaPage(sorted, featuredEvent);
    if (agendaQuick) renderAgendaQuick(sorted);
  } catch (error) {
    console.error("Error cargando agenda:", error);

    const agendaContainer = document.getElementById("agenda-container");
    if (agendaContainer) {
      agendaContainer.innerHTML = "<p>Agenda no disponible.</p>";
    }
  }
}

function renderAgendaFeatured(featured) {
  const container = document.getElementById("agenda-featured");
  if (!container || !featured) return;

  const placeParts = [];
  if (featured.plaza) placeParts.push(featured.plaza);
  if (featured.ciudad) placeParts.push(featured.ciudad);
  const placeText = placeParts.join(" · ");

  const hasBuyUrl = featured.buyUrl && String(featured.buyUrl).trim() !== "";

  const cta = hasBuyUrl
    ? `<a class="agenda-btn" href="${featured.buyUrl}" target="_blank" rel="noopener noreferrer">Comprar</a>`
    : `<span class="agenda-btn disabled">Próximamente</span>`;

  const poster = createPosterPlaceholder(featured);

  container.innerHTML = `
    <div class="featured-card">
      <div class="featured-poster">
        ${poster}
      </div>
      <div class="featured-body">
        <span class="agenda-badge">${featured.tipo || ""}</span>
        <h2 class="featured-title">${featured.titulo || ""}</h2>
        <p class="featured-place">${placeText}</p>
        <p class="featured-date"><strong>${formatDate(
          featured.fecha
        )}</strong>${featured.hora ? " · " + featured.hora : ""}</p>
        ${cta}
      </div>
    </div>
  `;
}

function createPosterPlaceholder(event) {
  const isSevilla =
    event.ciudad &&
    String(event.ciudad).toLowerCase().indexOf("sevilla") !== -1;
  const label = isSevilla ? "MAESTRANZA" : "LAS VENTAS";
  return `
    <div class="poster-placeholder ${
      isSevilla ? "poster-placeholder--maestranza" : "poster-placeholder--ventas"
    }">
      <span class="poster-badge">${label}</span>
      <span class="poster-mark">A5</span>
    </div>
  `;
}

function renderAgendaPage(events, featuredEvent) {
  const container = document.getElementById("agenda-container");
  if (!container) return;

  let list = Array.isArray(events) ? [...events] : [];

  if (featuredEvent) {
    list = list.filter((e) => {
      if (e.id && featuredEvent.id) {
        return e.id !== featuredEvent.id;
      }
      return !(
        e.fecha === featuredEvent.fecha &&
        e.titulo === featuredEvent.titulo &&
        e.plaza === featuredEvent.plaza
      );
    });
  }

  container.innerHTML = list
    .map((event) => {
      const isSevilla =
        event.ciudad &&
        String(event.ciudad).toLowerCase().indexOf("sevilla") !== -1;
      const cardClass = isSevilla
        ? "agenda-card agenda-card--sevilla"
        : "agenda-card";
      const hasBuyUrl = event.buyUrl && String(event.buyUrl).trim() !== "";

      const cta = hasBuyUrl
        ? `<a class="agenda-btn" href="${event.buyUrl}" target="_blank" rel="noopener noreferrer">Comprar</a>`
        : `<span class="agenda-btn disabled">Próximamente</span>`;

      const poster = createPosterPlaceholder(event);

      return `
    <div class="${cardClass}">
      <div class="agenda-poster">
        ${poster}
      </div>
      <div class="agenda-card__body">
        <span class="agenda-badge">${event.tipo || ""}</span>
        <h3 class="agenda-title">${event.titulo || ""}</h3>
        <p class="agenda-place">${event.plaza || ""}</p>
        <div class="agenda-meta">
          <div><strong>${formatDate(event.fecha)}</strong>${
        event.hora ? " · " + event.hora : ""
      }</div>
          <div>${event.ciudad || ""}</div>
        </div>
        ${cta}
      </div>
    </div>
  `;
    })
    .join("");
}

function formatAgendaQuickDate(dateStr) {
  if (!dateStr) return "";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

function renderAgendaQuick(events) {
  const container = document.getElementById("agenda-quick");
  if (!container) return;

  if (!Array.isArray(events)) {
    events = [];
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const upcoming = events
    .filter((e) => e.fecha && e.fecha >= todayStr)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 3);

  container.innerHTML = "";

  if (!upcoming.length) {
    const empty = document.createElement("p");
    empty.textContent = "No hay festejos programados en los próximos días.";
    container.appendChild(empty);
    return;
  }

  const featured = upcoming[0];
  const rest = upcoming.slice(1);

  const featuredBlock = document.createElement("div");
  featuredBlock.className = "agenda-quick-featured";

  const featuredDate = document.createElement("p");
  featuredDate.className = "agenda-quick-featured-date";
  featuredDate.textContent = formatDate(featured.fecha);

  const featuredTitle = document.createElement("p");
  featuredTitle.className = "agenda-quick-featured-title";
  featuredTitle.textContent =
    (featured.tipo ? featured.tipo + " · " : "") + (featured.titulo || "");

  featuredBlock.appendChild(featuredDate);
  featuredBlock.appendChild(featuredTitle);

  container.appendChild(featuredBlock);

  if (rest.length) {
    const list = document.createElement("ul");
    list.className = "agenda-list agenda-quick";

    rest.forEach((event) => {
      const li = document.createElement("li");
      li.className = "agenda-quick-item";

      const dateSpan = document.createElement("span");
      dateSpan.className = "agenda-date";
      dateSpan.textContent = formatAgendaQuickDate(event.fecha);

      const titleSpan = document.createElement("span");
      titleSpan.className = "agenda-quick-title";
      titleSpan.textContent = event.titulo || "";

      const timeSpan = document.createElement("span");
      timeSpan.className = "agenda-quick-time";
      timeSpan.textContent = event.hora || "";

      li.appendChild(dateSpan);
      li.appendChild(titleSpan);
      li.appendChild(timeSpan);

      list.appendChild(li);
    });

    container.appendChild(list);
  }

  const moreLink = document.createElement("a");
  moreLink.className = "agenda-quick-more";
  moreLink.href = "agenda.html";
  moreLink.textContent = "Ver agenda";
  container.appendChild(moreLink);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
