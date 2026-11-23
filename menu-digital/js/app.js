(function () {
  "use strict";

  var STRINGS = {
    pt: {
      welcome: "Bem-vindo ao",
      tagline: "Hambúrguer artesanal, cerveja gelada e boa vibe.",
      menu: "Ver cardápio",
      menuSub: "Burgers, cervejas e drinks",
      review: "Avalie a gente no Google",
      reviewSub: "Sua opinião ajuda muito · Como chegar",
      wifi: "Wi-Fi grátis",
      wifiSub: "Toque para ver a senha",
      network: "Rede",
      password: "Senha",
      copy: "Copiar",
      copied: "Copiado!",
      hours: "Ter a Dom · 18h às 00h",
      back: "Voltar",
      menuTitle: "Cardápio",
      priceNote: "Preços em R$",
      tag_casa: "da casa",
      tag_artesanal: "artesanal",
      tag_novo: "novo",
      promoFlag: "Ofertas",
      before: "antes",
    },
    es: {
      welcome: "Bienvenidos a",
      tagline: "Hamburguesas artesanales, cerveza fría y buena onda.",
      menu: "Ver menú",
      menuSub: "Hamburguesas, cervezas y tragos",
      review: "Dejanos tu reseña en Google",
      reviewSub: "Tu opinión nos ayuda un montón · Cómo llegar",
      wifi: "Wi-Fi gratis",
      wifiSub: "Tocá para ver la clave",
      network: "Red",
      password: "Clave",
      copy: "Copiar",
      copied: "¡Copiado!",
      hours: "Mar a Dom · 18 a 00 h",
      back: "Volver",
      menuTitle: "Menú",
      priceNote: "Precios en R$ (reales)",
      tag_casa: "de la casa",
      tag_artesanal: "artesanal",
      tag_novo: "nuevo",
      promoFlag: "Ofertas",
      before: "antes",
    },
  };

  // ---------- idioma ----------
  function storedLang() {
    try { return localStorage.getItem("cb-lang"); } catch (e) { return null; }
  }
  function saveLang(l) {
    try { localStorage.setItem("cb-lang", l); } catch (e) { /* sin storage */ }
  }
  var lang = storedLang();
  if (lang !== "pt" && lang !== "es") {
    lang = (navigator.language || "pt").toLowerCase().indexOf("es") === 0 ? "es" : "pt";
  }

  function t(key) { return STRINGS[lang][key] || STRINGS.pt[key] || key; }

  function applyLang() {
    document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    if (document.getElementById("menu")) renderMenu();
  }

  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.getAttribute("data-lang");
      saveLang(lang);
      applyLang();
    });
  });

  // ---------- inicio ----------
  var C = window.CONFIG || {};
  var review = document.getElementById("review-link");
  if (review && C.reviewUrl) review.href = C.reviewUrl;
  var ig = document.getElementById("ig-link");
  if (ig && C.instagram) ig.href = C.instagram;
  var addr = document.getElementById("address");
  if (addr && C.address) addr.textContent = C.address;

  var wifiBox = document.getElementById("wifi");
  if (wifiBox && C.wifi) {
    var toggle = wifiBox.querySelector(".wifi-toggle");
    var body = document.getElementById("wifi-body");
    document.getElementById("wifi-ssid").textContent = C.wifi.ssid;
    document.getElementById("wifi-pass").textContent = C.wifi.password;
    toggle.addEventListener("click", function () {
      var open = body.hidden;
      body.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      wifiBox.classList.toggle("open", open);
    });
    var copyBtn = document.getElementById("copy-pass");
    copyBtn.addEventListener("click", function () {
      var done = function () {
        copyBtn.textContent = t("copied");
        copyBtn.classList.add("ok");
        setTimeout(function () {
          copyBtn.textContent = t("copy");
          copyBtn.classList.remove("ok");
        }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(C.wifi.password).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = C.wifi.password;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* nada */ }
        document.body.removeChild(ta);
      }
    });
  }

  // Datos editables desde el panel (Configuración): Wi-Fi y link de reseñas.
  // Si Supabase no responde, quedan los valores de data/config.js.
  function showWifi() {
    if (!wifiBox || !C.wifi) return;
    document.getElementById("wifi-ssid").textContent = C.wifi.ssid;
    var hasPass = !!C.wifi.password;
    document.getElementById("wifi-pass").textContent = hasPass ? C.wifi.password : "—";
    document.getElementById("copy-pass").hidden = !hasPass;
  }
  if ((review || wifiBox) && C.supabaseUrl && C.supabaseAnonKey && window.fetch) {
    fetch(C.supabaseUrl + "/rest/v1/settings?select=key,value", { headers: { apikey: C.supabaseAnonKey } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        var s = {};
        rows.forEach(function (row) { s[row.key] = row.value || ""; });
        if (review && /^https:\/\//.test(s.review_url || "")) review.href = s.review_url;
        if (C.wifi) {
          if (s.wifi_ssid) C.wifi.ssid = s.wifi_ssid;
          if (s.wifi_password != null) C.wifi.password = s.wifi_password;
          showWifi();
        }
      })
      .catch(function (err) { console.warn("Ajustes: uso los valores locales", err); });
  }

  // ---------- menú ----------
  // Forma normalizada: [{ id, title:{pt,es}, note, items:[...], subs:[{ id, title, note, items }] }]
  var menuData = null;
  var menuState = "loading"; // loading | ready

  function tr(pt, es) { return { pt: pt || es || "", es: es || pt || "" }; }

  function fromLocal() {
    return (window.MENU || []).map(function (c) {
      return {
        id: c.id, title: c.title, note: c.note || null, subs: [], highlight: !!c.highlight,
        items: c.items.map(function (it) {
          return { name: it.name, desc: it.desc || null, price: it.price, priceBefore: it.priceBefore || null, tags: it.tags || [], photo: it.photo || null };
        }),
      };
    });
  }

  function fromSupabase() {
    var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: false } });
    return Promise.all([
      sb.from("categories").select("*").eq("active", true).order("position"),
      sb.from("items").select("*").eq("available", true).order("position"),
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      if (res[1].error) throw res[1].error;
      var cats = res[0].data, items = res[1].data;
      function mapItem(it) {
        return {
          name: tr(it.name_pt, it.name_es),
          desc: it.desc_pt || it.desc_es ? tr(it.desc_pt, it.desc_es) : null,
          price: Number(it.price),
          priceBefore: it.price_before != null ? Number(it.price_before) : null,
          tags: it.tags || [],
          photo: it.photo_path ? sb.storage.from("menu-photos").getPublicUrl(it.photo_path).data.publicUrl : null,
        };
      }
      function itemsOf(id) { return items.filter(function (i) { return i.category_id === id; }).map(mapItem); }
      function mapCat(c) {
        return { id: "c-" + c.id, title: tr(c.name_pt, c.name_es), note: c.note_pt || c.note_es ? tr(c.note_pt, c.note_es) : null, items: itemsOf(c.id), highlight: !!c.highlight };
      }
      return cats.filter(function (c) { return !c.parent_id; }).map(function (c) {
        var cat = mapCat(c);
        cat.subs = cats.filter(function (s) { return s.parent_id === c.id; }).map(mapCat)
          .filter(function (s) { return s.items.length; });
        return cat;
      }).filter(function (c) { return c.items.length || c.subs.length; });
    });
  }

  function loadMenu() {
    var useDb = C.supabaseUrl && C.supabaseAnonKey && window.supabase;
    var p = useDb ? fromSupabase() : Promise.resolve(fromLocal());
    return p.catch(function (err) {
      console.error("No se pudo cargar el menú desde Supabase, uso el local.", err);
      return fromLocal();
    }).then(function (data) {
      menuData = data;
      menuState = "ready";
      renderMenu();
    });
  }

  function fmt(n) {
    return "R$ " + n.toFixed(2).replace(".", ",");
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderItems(list) {
    var ul = el("ul");
    list.forEach(function (it) {
      var li = el("li", "item" + (it.photo ? " has-photo" : ""));
      var body = el("div", "item-body");
      var top = el("div", "item-top");
      var name = el("h3", null, it.name[lang]);
      it.tags.forEach(function (tg) {
        name.appendChild(el("span", "badge badge-" + tg, t("tag_" + tg)));
      });
      top.appendChild(name);
      top.appendChild(el("span", "dots"));
      top.appendChild(el("span", "price", fmt(it.price)));
      body.appendChild(top);
      if (it.desc) body.appendChild(el("p", "desc", it.desc[lang]));
      li.appendChild(body);
      if (it.photo) {
        var img = el("img", "photo");
        img.src = it.photo;
        img.alt = it.name[lang];
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 96;
        img.height = 96;
        img.addEventListener("click", function () { openPhoto(it.photo, it.name[lang]); });
        li.appendChild(img);
      }
      ul.appendChild(li);
    });
    return ul;
  }

  // Promociones: tarjetas blancas con cinta de peligro de contenedor, sello de descuento y precio tachado.
  function renderPromos(list) {
    var ul = el("ul", "promo-list");
    list.forEach(function (it, i) {
      var li = el("li", "promo-card");
      li.style.setProperty("--i", i);
      if (it.photo) {
        var img = el("img", "promo-photo");
        img.src = it.photo;
        img.alt = it.name[lang];
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("click", function () { openPhoto(it.photo, it.name[lang]); });
        li.appendChild(img);
      }
      var body = el("div", "promo-body");
      if (it.priceBefore && it.priceBefore > it.price) {
        var off = Math.round((1 - it.price / it.priceBefore) * 100);
        body.appendChild(el("span", "promo-stamp", "-" + off + "%"));
      }
      body.appendChild(el("h3", "promo-name", it.name[lang]));
      if (it.desc) body.appendChild(el("p", "promo-desc", it.desc[lang]));
      var price = el("div", "promo-price");
      if (it.priceBefore && it.priceBefore > it.price) {
        var old = el("span", "promo-old");
        old.appendChild(el("small", null, t("before") + " "));
        old.appendChild(el("s", null, fmt(it.priceBefore)));
        price.appendChild(old);
      }
      price.appendChild(el("span", "promo-now", fmt(it.price)));
      body.appendChild(price);
      li.appendChild(body);
      ul.appendChild(li);
    });
    return ul;
  }

  function renderMenu() {
    var main = document.getElementById("menu");
    var tabs = document.getElementById("tabs");
    main.querySelectorAll(".cat, .loading").forEach(function (n) { n.remove(); });
    tabs.innerHTML = "";

    if (menuState === "loading") {
      main.appendChild(el("p", "loading", "…"));
      return;
    }

    menuData.forEach(function (cat, i) {
      var a = el("a", (i === 0 ? "active " : "") + (cat.highlight ? "tab-promo" : ""), cat.title[lang]);
      a.href = "#" + cat.id;
      tabs.appendChild(a);

      var sec = el("section", cat.highlight ? "cat promo" : "cat panel");
      sec.id = cat.id;
      var head = el("div", "cat-head");
      if (cat.highlight) {
        var flag = el("span", "promo-flag");
        flag.appendChild(el("span", "promo-dot"));
        flag.appendChild(document.createTextNode(t("promoFlag")));
        head.appendChild(flag);
      } else {
        head.appendChild(el("span", "tag", String(i + 1).padStart(2, "0")));
      }
      head.appendChild(el("h2", null, cat.title[lang]));
      sec.appendChild(head);
      if (cat.note) sec.appendChild(el("p", "cat-note", cat.note[lang]));
      if (cat.items.length) sec.appendChild(cat.highlight ? renderPromos(cat.items) : renderItems(cat.items));
      cat.subs.forEach(function (sub) {
        sec.appendChild(el("h3", "sub-title", sub.title[lang]));
        if (sub.note) sec.appendChild(el("p", "cat-note", sub.note[lang]));
        sec.appendChild(renderItems(sub.items));
      });
      main.appendChild(sec);
    });

    watchTabs();
  }

  // foto ampliada
  function openPhoto(src, alt) {
    var box = el("div", "lightbox");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", alt);
    var img = el("img");
    img.src = src;
    img.alt = alt;
    box.appendChild(img);
    box.appendChild(el("span", "lightbox-caption", alt));
    function close() { box.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    box.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
  }

  var observer;
  function watchTabs() {
    if (!("IntersectionObserver" in window)) return;
    if (observer) observer.disconnect();
    var tabs = document.getElementById("tabs");
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tabs.querySelectorAll("a").forEach(function (a) {
          var on = a.getAttribute("href") === "#" + e.target.id;
          a.classList.toggle("active", on);
          if (on) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".cat").forEach(function (s) { observer.observe(s); });
  }

  applyLang();
  if (document.getElementById("menu")) loadMenu();
})();
