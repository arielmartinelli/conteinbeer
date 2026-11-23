(function () {
  "use strict";

  var C = window.CONFIG || {};
  var BUCKET = "menu-photos";
  var TAGS = [
    { id: "casa", label: "De la casa" },
    { id: "artesanal", label: "Artesanal" },
    { id: "novo", label: "Nuevo" },
  ];
  var TITLES = { items: "Platos", categories: "Categorías", account: "Mi cuenta" };

  var $ = function (s) { return document.querySelector(s); };

  // Crea elementos sin innerHTML (todo texto va como textContent).
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
        else if (k === "value") el.value = v;
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    children.flat(Infinity).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function icon(d, extra) {
    var NS = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (extra) s.setAttribute("class", extra);
    d.split("|").forEach(function (p) {
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", p);
      s.appendChild(path);
    });
    return s;
  }
  var I = {
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z|M20 20l-4-4",
    camera: "M4 8h3l2-3h6l2 3h3v11H4z|M12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    up: "M12 19V5|M6 11l6-6 6 6",
    down: "M12 5v14|M6 13l6 6 6-6",
    edit: "M4 20h4L19 9l-4-4L4 16z|M14 6l4 4",
    chev: "M9 6l6 6-6 6",
    plus: "M12 5v14|M5 12h14",
  };

  var toastTimer;
  function toast(msg, isError) {
    var t = $("#toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, isError ? 6000 : 2600);
  }

  function show(view) {
    ["setup", "login", "forgot", "recovery", "app"].forEach(function (v) { $("#view-" + v).hidden = v !== view; });
  }

  function money(n) { return "R$ " + Number(n).toFixed(2).replace(".", ","); }
  function byPos(a, b) { return a.position - b.position; }
  function norm(s) { return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) {
    show("setup");
    return;
  }

  // "Mantener sesión iniciada": si está tildado la sesión queda guardada en el navegador;
  // si no, se borra al cerrar la pestaña.
  var REM = "cb-remember";
  function remembering() { try { return localStorage.getItem(REM) !== "0"; } catch (e) { return true; } }
  function setRemember(on) { try { localStorage.setItem(REM, on ? "1" : "0"); } catch (e) { /* sin storage */ } }
  var authStorage = {
    getItem: function (k) {
      try { var v = localStorage.getItem(k); return v != null ? v : sessionStorage.getItem(k); } catch (e) { return null; }
    },
    setItem: function (k, v) {
      try {
        var keep = remembering();
        (keep ? localStorage : sessionStorage).setItem(k, v);
        (keep ? sessionStorage : localStorage).removeItem(k);
      } catch (e) { /* sin storage */ }
    },
    removeItem: function (k) {
      try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* sin storage */ }
    },
  };
  var isRecovery = /type=recovery/.test(location.hash);
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
    auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  var cats = [];
  var items = [];
  var me = "";
  var state = { view: "items", filter: "all", q: "", reorder: false };

  function topCats() { return cats.filter(function (c) { return !c.parent_id; }).sort(byPos); }
  function subCats(id) { return cats.filter(function (c) { return c.parent_id === id; }).sort(byPos); }
  function itemsOf(id) { return items.filter(function (i) { return i.category_id === id; }).sort(byPos); }
  function catById(id) { return cats.find(function (c) { return c.id === id; }); }
  function catName(c) { return c.name_es || c.name_pt; }
  function catLabel(c) {
    if (!c.parent_id) return catName(c);
    var p = catById(c.parent_id);
    return (p ? catName(p) + " › " : "") + catName(c);
  }
  function catOrder() {
    return topCats().reduce(function (acc, t) { return acc.concat([t], subCats(t.id)); }, []);
  }
  function countDeep(id) {
    return itemsOf(id).length + subCats(id).reduce(function (n, s) { return n + itemsOf(s.id).length; }, 0);
  }
  function photoUrl(path) { return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }

  // ---------- sesión ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showLogin(msg) {
    show("login");
    $("#login-error").textContent = msg || "";
    try { $("#remember").checked = remembering(); } catch (e) { /* nada */ }
  }

  // Devuelve true si entró al panel.
  async function enter() {
    var u = await sb.auth.getUser();
    var user = u.data && u.data.user;
    if (!user) { showLogin(); return false; }
    var r = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (r.error || !r.data) {
      await sb.auth.signOut();
      showLogin("Este usuario no tiene permiso para editar el menú.");
      return false;
    }
    me = user.email;
    show("app");
    await load();
    return true;
  }

  // Contraseña incorrecta: la tarjeta "golpea" como un contenedor que choca.
  function shakeCard(card) {
    card.classList.remove("shake");
    void card.offsetWidth; // reinicia la animación
    card.classList.add("shake");
    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
  }

  // Entrada correcta: cae un contenedor y se abre el panel (menos de 1 segundo).
  function playDrop() {
    if (reduceMotion) return Promise.resolve();
    var o = $("#drop");
    o.hidden = false;
    o.classList.remove("play");
    void o.offsetWidth;
    o.classList.add("play");
    return new Promise(function (resolve) {
      setTimeout(function () { o.classList.remove("play"); o.hidden = true; resolve(); }, 950);
    });
  }

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var form = e.target;
    var f = new FormData(form);
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    $("#login-error").textContent = "";
    setRemember($("#remember").checked);
    var r = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
    if (r.error) {
      btn.disabled = false;
      $("#login-error").textContent = /confirm/i.test(r.error.message)
        ? "Falta confirmar el email. Revisá tu casilla."
        : "Email o contraseña incorrectos.";
      form.password.value = "";
      form.password.focus();
      shakeCard(form.closest(".auth-card"));
      return;
    }
    var anim = playDrop();
    var ok = await enter();
    btn.disabled = false;
    if (ok) await anim;
  });

  // Olvidé mi contraseña
  $("#go-forgot").addEventListener("click", function () {
    show("forgot");
    $("#forgot-email").value = $("#login-email").value;
    $("#forgot-error").textContent = "";
    $("#forgot-ok").textContent = "";
    $("#forgot-email").focus();
  });
  $("#back-login").addEventListener("click", function () { showLogin(); });
  $("#forgot-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("#forgot-email").value.trim();
    var btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    $("#forgot-error").textContent = "";
    var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    btn.disabled = false;
    if (r.error) {
      $("#forgot-error").textContent = /rate|seconds/i.test(r.error.message)
        ? "Esperá un minuto antes de pedir otro link."
        : "No se pudo enviar: " + r.error.message;
      return;
    }
    $("#forgot-ok").textContent = "Listo. Si " + email + " tiene acceso al panel, te llegó un mail con el link (revisá también spam).";
  });

  // Vuelve del link del email: elegir contraseña nueva
  async function showRecovery() {
    show("recovery");
    var u = await sb.auth.getUser();
    $("#recovery-user").value = (u.data && u.data.user && u.data.user.email) || "";
  }
  $("#recovery-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = new FormData(e.target);
    var err = $("#recovery-error");
    err.textContent = "";
    if (f.get("next") !== f.get("repeat")) { err.textContent = "Las contraseñas no coinciden."; return; }
    var btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    var r = await sb.auth.updateUser({ password: f.get("next") });
    btn.disabled = false;
    if (r.error) {
      err.textContent = /expired|invalid|session/i.test(r.error.message)
        ? "El link venció. Pedí uno nuevo desde “¿Olvidaste tu contraseña?”."
        : "No se pudo guardar: " + r.error.message;
      return;
    }
    isRecovery = false;
    history.replaceState(null, "", location.pathname);
    toast("Contraseña actualizada");
    var anim = playDrop();
    if (await enter()) await anim;
  });
  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { isRecovery = true; showRecovery(); }
  });

  async function logout() {
    await sb.auth.signOut();
    showLogin();
  }
  $("#logout").addEventListener("click", logout);

  document.querySelectorAll("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.view = b.getAttribute("data-view");
      state.reorder = false;
      render();
      window.scrollTo(0, 0);
    });
  });

  // ---------- datos ----------
  async function load() {
    var res = await Promise.all([
      sb.from("categories").select("*").order("position"),
      sb.from("items").select("*").order("position"),
    ]);
    var err = res[0].error || res[1].error;
    if (err) return toast("Error al cargar: " + err.message, true);
    cats = res[0].data;
    items = res[1].data;
    if (state.filter !== "all" && !catById(state.filter)) state.filter = "all";
    render();
  }

  async function run(promise, okMsg) {
    var r = await promise;
    if (r && r.error) {
      toast("No se pudo guardar: " + r.error.message, true);
      return null;
    }
    if (okMsg) toast(okMsg);
    return r;
  }

  async function move(rec, siblings, table, dir) {
    var arr = siblings.slice();
    var i = arr.indexOf(rec);
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    var ups = arr
      .map(function (r, k) { return { r: r, pos: k + 1 }; })
      .filter(function (x) { return x.r.position !== x.pos; });
    var res = await Promise.all(ups.map(function (x) {
      return sb.from(table).update({ position: x.pos }).eq("id", x.r.id);
    }));
    var bad = res.find(function (r) { return r.error; });
    if (bad) toast("No se pudo mover: " + bad.error.message, true);
    await load();
  }

  function moveBtns(rec, siblings, table) {
    var i = siblings.indexOf(rec);
    return h("span", { class: "move" },
      h("button", { class: "icon-btn", type: "button", "aria-label": "Subir", title: "Subir", disabled: i === 0,
        onclick: function () { move(rec, siblings, table, -1); } }, icon(I.up)),
      h("button", { class: "icon-btn", type: "button", "aria-label": "Bajar", title: "Bajar", disabled: i === siblings.length - 1,
        onclick: function () { move(rec, siblings, table, 1); } }, icon(I.down)));
  }

  // ---------- render general ----------
  function render() {
    document.querySelectorAll("[data-view]").forEach(function (b) {
      var on = b.getAttribute("data-view") === state.view;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    document.body.classList.toggle("reorder", state.reorder);
    $("#count-items").textContent = items.length;
    $("#count-cats").textContent = cats.length;
    $("#me-email").textContent = me;
    renderSideCats();

    var filtered = state.view === "items" && state.filter !== "all" && catById(state.filter);
    $("#crumb").textContent = filtered ? "Platos" : "Conteinbeer";
    $("#view-title").textContent = filtered ? catLabel(filtered) : TITLES[state.view];
    renderTopActions();

    var body = $("#view-body");
    body.replaceChildren(
      state.view === "items" ? itemsView()
        : state.view === "categories" ? categoriesView()
        : accountView());
  }

  function renderTopActions() {
    var box = $("#top-actions");
    box.replaceChildren();
    if (state.view === "account") return;
    var isItems = state.view === "items";
    box.appendChild(h("button", { class: "btn ghost m-only", type: "button",
      onclick: function () { state.reorder = !state.reorder; render(); } }, state.reorder ? "Listo" : "Ordenar"));
    box.appendChild(h("button", { class: "btn btn-add", type: "button",
      "aria-label": isItems ? "Agregar plato" : "Agregar categoría",
      onclick: function () { isItems ? editItem(null) : editCat(null); } },
      icon(I.plus), h("span", { class: "lbl", text: isItems ? "Nuevo plato" : "Nueva categoría" })));
  }

  function renderSideCats() {
    var box = $("#side-cats");
    box.replaceChildren();
    function sideCat(id, label, n, isSub) {
      var active = state.view === "items" && state.filter === id;
      return h("button", { class: "side-cat" + (isSub ? " sub" : "") + (active ? " active" : ""), type: "button",
        onclick: function () { state.view = "items"; state.filter = id; state.q = ""; state.reorder = false; render(); } },
        h("span", { class: "side-cat-name", text: label }),
        h("span", { class: "count", text: String(n) }));
    }
    box.appendChild(sideCat("all", "Todos", items.length, false));
    topCats().forEach(function (t) {
      box.appendChild(sideCat(t.id, catName(t), countDeep(t.id), false));
      subCats(t.id).forEach(function (s) { box.appendChild(sideCat(s.id, catName(s), itemsOf(s.id).length, true)); });
    });
  }

  function empty(text) { return h("div", { class: "empty" }, h("p", { text: text })); }

  // ---------- vista: platos ----------
  function itemsView() {
    var wrap = h("div", { class: "view" });

    var noStock = items.filter(function (i) { return !i.available; }).length;
    var noPhoto = items.filter(function (i) { return !i.photo_path; }).length;
    function stat(label, value, hint, tone) {
      return h("div", { class: "stat" + (tone ? " " + tone : "") },
        h("span", { class: "stat-label", text: label }),
        h("strong", { class: "stat-value", text: String(value) }),
        h("span", { class: "stat-hint", text: hint }));
    }
    wrap.appendChild(h("div", { class: "stats d-only" },
      stat("Platos", items.length, "en el menú"),
      stat("Sin stock", noStock, noStock ? "ocultos del menú" : "todo disponible", noStock ? "warn" : ""),
      stat("Sin foto", noPhoto, noPhoto ? "conviene agregarles" : "todos con foto"),
      stat("Categorías", topCats().length, plural(cats.length - topCats().length, "subcategoría", "subcategorías"))));

    var list = h("div", { class: "groups" });
    var search = h("input", { type: "search", class: "search-input", placeholder: "Buscar plato", value: state.q,
      "aria-label": "Buscar plato", autocomplete: "off",
      oninput: function (e) { state.q = e.target.value; renderItemList(list); } });
    wrap.appendChild(h("div", { class: "tools" }, h("label", { class: "search" }, icon(I.search), search)));

    var chips = h("div", { class: "chips m-only", role: "tablist" });
    function chip(id, label) {
      var cur = catById(state.filter);
      var active = state.filter === id || (cur && cur.parent_id === id);
      return h("button", { class: "chip" + (active ? " active" : ""), type: "button", role: "tab", "aria-selected": String(!!active),
        onclick: function () { state.filter = id; render(); } }, label);
    }
    chips.appendChild(chip("all", "Todos"));
    topCats().forEach(function (c) { chips.appendChild(chip(c.id, catName(c))); });
    wrap.appendChild(chips);

    wrap.appendChild(list);
    renderItemList(list);
    return wrap;
  }

  function renderItemList(list) {
    list.replaceChildren();
    var q = norm(state.q.trim());
    var groups = catOrder().filter(function (c) {
      return state.filter === "all" || c.id === state.filter || c.parent_id === state.filter;
    });
    var shownAny = false;
    groups.forEach(function (c) {
      var all = itemsOf(c.id);
      var shown = q ? all.filter(function (i) { return norm(i.name_es).indexOf(q) >= 0 || norm(i.name_pt).indexOf(q) >= 0; }) : all;
      if (!shown.length) return;
      shownAny = true;
      list.appendChild(h("section", { class: "group" },
        h("h2", { class: "group-head" }, h("span", { text: catLabel(c) }), h("span", { class: "group-count", text: plural(all.length, "plato", "platos") })),
        h("div", { class: "cells" }, shown.map(function (it) { return itemRow(it, all, !q); }))));
    });
    if (!shownAny) {
      list.appendChild(empty(q ? "No hay platos que coincidan con “" + state.q.trim() + "”."
        : !cats.length ? "Primero creá una categoría en la sección Categorías."
        : "Todavía no hay platos acá. Tocá “+” para agregar uno."));
    }
  }

  function availSwitch(it) {
    return h("label", { class: "switch", title: it.available ? "Disponible" : "Sin stock" },
      h("input", { type: "checkbox", checked: it.available, "aria-label": "Disponible: " + (it.name_es || it.name_pt),
        onchange: async function (e) {
          await run(sb.from("items").update({ available: e.target.checked }).eq("id", it.id),
            e.target.checked ? "Disponible" : "Marcado sin stock");
          await load();
        } }),
      h("span", { class: "slider" }));
  }

  function itemRow(it, siblings, canMove) {
    var name = it.name_es || it.name_pt;
    var desc = it.desc_es || it.desc_pt || "Sin descripción";
    return h("div", { class: "cell item-cell" + (it.available ? "" : " off") },
      it.photo_path
        ? h("img", { class: "thumb", src: photoUrl(it.photo_path), alt: "", loading: "lazy" })
        : h("span", { class: "thumb none" }, icon(I.camera)),
      h("button", { class: "cell-main", type: "button", onclick: function () { editItem(it); } },
        h("span", { class: "cell-title" }, name,
          (it.tags || []).map(function (t) { return h("span", { class: "tag tag-" + t, text: (TAGS.find(function (x) { return x.id === t; }) || {}).label || t }); })),
        h("span", { class: "cell-sub d-only", text: desc }),
        h("span", { class: "cell-sub m-only", text: money(it.price) + (it.available ? "" : " · Sin stock") })),
      h("span", { class: "cell-status d-only" + (it.available ? " ok" : " no"), text: it.available ? "Disponible" : "Sin stock" }),
      h("span", { class: "cell-price d-only", text: money(it.price) }),
      availSwitch(it),
      canMove ? moveBtns(it, siblings, "items") : null,
      h("button", { class: "icon-btn d-only", type: "button", title: "Editar", "aria-label": "Editar " + name,
        onclick: function () { editItem(it); } }, icon(I.edit)),
      h("span", { class: "chev m-only" }, icon(I.chev)));
  }

  // ---------- vista: categorías ----------
  function categoriesView() {
    var wrap = h("div", { class: "view" });
    wrap.appendChild(h("p", { class: "view-hint", text: "Cada bloque es una categoría con sus subcategorías. Tocá una para editarla." }));
    var tops = topCats();
    if (!tops.length) wrap.appendChild(empty("Todavía no hay categorías. Tocá “+” para crear la primera."));
    tops.forEach(function (t) {
      var subs = subCats(t.id);
      wrap.appendChild(h("section", { class: "group" },
        h("div", { class: "cells" }, catRow(t, tops, false), subs.map(function (s) { return catRow(s, subs, true); }))));
    });
    return wrap;
  }

  function catRow(c, siblings, isSub) {
    var n = isSub ? itemsOf(c.id).length : countDeep(c.id);
    var subs = isSub ? [] : subCats(c.id);
    var meta = [
      c.name_pt && c.name_pt !== c.name_es ? "PT: " + c.name_pt : null,
      plural(n, "plato", "platos"),
      subs.length ? plural(subs.length, "subcategoría", "subcategorías") : null,
      c.active ? null : "Oculta",
    ].filter(Boolean).join(" · ");
    return h("div", { class: "cell cat-cell" + (isSub ? " sub" : "") + (c.active ? "" : " off") },
      h("span", { class: "cat-icon", "aria-hidden": "true", text: isSub ? "↳" : catName(c).slice(0, 1).toUpperCase() }),
      h("button", { class: "cell-main", type: "button", onclick: function () { editCat(c); } },
        h("span", { class: "cell-title", text: catName(c) }),
        h("span", { class: "cell-sub", text: meta })),
      h("button", { class: "link-btn d-only", type: "button",
        onclick: function () { state.view = "items"; state.filter = c.id; render(); } }, "Ver platos"),
      moveBtns(c, siblings, "categories"),
      h("button", { class: "icon-btn d-only", type: "button", title: "Editar", "aria-label": "Editar " + catName(c),
        onclick: function () { editCat(c); } }, icon(I.edit)),
      h("span", { class: "chev m-only" }, icon(I.chev)));
  }

  // ---------- vista: mi cuenta ----------
  async function checkPassword(pw) {
    var r = await sb.auth.signInWithPassword({ email: me, password: pw });
    return !r.error;
  }

  function accountView() {
    var emailErr = h("p", { class: "form-error", role: "alert" });
    var emailForm = h("form", { class: "form" },
      field("Email nuevo", h("input", { name: "email", type: "email", required: true, autocomplete: "email" })),
      field("Contraseña actual", h("input", { name: "current", type: "password", required: true, autocomplete: "current-password" })),
      emailErr,
      h("button", { class: "btn", type: "submit" }, "Cambiar email"));
    emailForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = new FormData(emailForm);
      var next = String(f.get("email")).trim();
      emailErr.textContent = "";
      if (next.toLowerCase() === me.toLowerCase()) { emailErr.textContent = "Es el mismo email que ya usás."; return; }
      var btn = emailForm.querySelector("button"); btn.disabled = true;
      if (!(await checkPassword(f.get("current")))) {
        btn.disabled = false;
        emailErr.textContent = "La contraseña actual no es correcta.";
        return;
      }
      var r = await sb.auth.updateUser({ email: next }, { emailRedirectTo: location.origin + location.pathname });
      btn.disabled = false;
      if (r.error) { emailErr.textContent = "No se pudo cambiar: " + r.error.message; return; }
      emailForm.reset();
      toast("Te mandamos un mail a " + next + " para confirmar. Hasta entonces seguís entrando con " + me + ".");
    });

    var passErr = h("p", { class: "form-error", role: "alert" });
    var passForm = h("form", { class: "form" },
      field("Contraseña actual", h("input", { name: "current", type: "password", required: true, autocomplete: "current-password" })),
      field("Contraseña nueva", h("input", { name: "next", type: "password", required: true, minlength: "8", autocomplete: "new-password" }), "Mínimo 8 caracteres."),
      field("Repetir contraseña nueva", h("input", { name: "repeat", type: "password", required: true, minlength: "8", autocomplete: "new-password" })),
      passErr,
      h("button", { class: "btn", type: "submit" }, "Cambiar contraseña"));
    passForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = new FormData(passForm);
      passErr.textContent = "";
      if (f.get("next") !== f.get("repeat")) { passErr.textContent = "Las contraseñas nuevas no coinciden."; return; }
      if (f.get("next") === f.get("current")) { passErr.textContent = "La nueva tiene que ser distinta a la actual."; return; }
      var btn = passForm.querySelector("button"); btn.disabled = true;
      if (!(await checkPassword(f.get("current")))) {
        btn.disabled = false;
        passErr.textContent = "La contraseña actual no es correcta.";
        return;
      }
      var r = await sb.auth.updateUser({ password: f.get("next") });
      btn.disabled = false;
      if (r.error) { passErr.textContent = "No se pudo cambiar: " + r.error.message; return; }
      passForm.reset();
      toast("Contraseña actualizada");
    });

    return h("div", { class: "view account" },
      h("section", { class: "group" },
        h("div", { class: "cells" },
          h("div", { class: "cell profile" },
            h("span", { class: "avatar", "aria-hidden": "true", text: (me || "?").slice(0, 1).toUpperCase() }),
            h("div", { class: "cell-main static" },
              h("span", { class: "cell-title", text: me }),
              h("span", { class: "cell-sub", text: "Administrador del menú" }))))),
      h("section", { class: "group" }, h("h2", { class: "group-head" }, h("span", { text: "Cambiar email" })), h("div", { class: "card" }, emailForm)),
      h("section", { class: "group" }, h("h2", { class: "group-head" }, h("span", { text: "Cambiar contraseña" })), h("div", { class: "card" }, passForm)),
      h("section", { class: "group m-only" },
        h("div", { class: "cells" },
          h("button", { class: "cell danger-cell", type: "button", onclick: logout }, "Cerrar sesión"))));
  }

  // ---------- diálogos (hoja en celular, modal en PC) ----------
  var dlg = $("#dlg");
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  function field(label, input, hint) {
    return h("label", { class: "fld" }, h("span", { text: label }), input, hint ? h("small", { text: hint }) : null);
  }

  function openDialog(title, formChildren, onSubmit, onDelete) {
    var form = h("form", { class: "form", method: "dialog" },
      h("div", { class: "sheet-head" },
        h("button", { class: "link-btn", type: "button", onclick: function () { dlg.close(); } }, "Cancelar"),
        h("h2", { text: title }),
        h("button", { class: "link-btn strong", type: "submit" }, "Guardar")),
      h("div", { class: "sheet-body" },
        formChildren,
        onDelete ? h("button", { class: "btn danger btn-block", type: "button", onclick: onDelete }, "Eliminar") : null));
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var btns = form.querySelectorAll("button");
      btns.forEach(function (b) { b.disabled = true; });
      var ok = await onSubmit(new FormData(form), form);
      btns.forEach(function (b) { b.disabled = false; });
      if (ok) { dlg.close(); await load(); }
    });
    dlg.replaceChildren(form);
    dlg.showModal();
    if (window.matchMedia("(min-width: 900px)").matches) {
      var first = form.querySelector(".sheet-body input:not([type=file]), .sheet-body textarea");
      if (first) first.focus();
    }
  }

  function txt(v) { v = (v || "").trim(); return v || null; }

  function editCat(c) {
    var isNew = !c;
    c = c || { name_pt: "", name_es: "", note_pt: "", note_es: "", parent_id: null, active: true };
    var hasSubs = !isNew && subCats(c.id).length > 0;
    var parentSel = h("select", { name: "parent_id", disabled: hasSubs },
      h("option", { value: "" }, "Ninguna (es categoría principal)"),
      topCats().filter(function (p) { return p.id !== c.id; }).map(function (p) {
        return h("option", { value: p.id, selected: p.id === c.parent_id }, catName(p));
      }));
    if (!c.parent_id) parentSel.value = "";

    openDialog(isNew ? "Nueva categoría" : "Editar categoría", [
      field("Nombre en español", h("input", { name: "name_es", value: c.name_es || "", placeholder: "Ej: Hamburguesas" })),
      field("Nombre en portugués *", h("input", { name: "name_pt", value: c.name_pt || "", required: true, placeholder: "Ex: Hambúrgueres" })),
      field("Nota en español", h("input", { name: "note_es", value: c.note_es || "", placeholder: "Ej: Todas con papas fritas" }), "Opcional, aparece debajo del título."),
      field("Nota en portugués", h("input", { name: "note_pt", value: c.note_pt || "", placeholder: "Ex: Todos com batata frita" })),
      field("Dentro de", parentSel, hasSubs
        ? "Tiene subcategorías, así que sigue siendo principal."
        : "Elegí una si querés que sea subcategoría (ej: Cervezas › Porrón)."),
      h("label", { class: "check-row" }, h("span", { text: "Visible en el menú" }),
        h("span", { class: "switch" }, h("input", { type: "checkbox", name: "active", checked: c.active }), h("span", { class: "slider" }))),
    ], async function (f) {
      var parent = hasSubs ? null : (f.get("parent_id") || null);
      var siblings = cats.filter(function (x) { return (x.parent_id || null) === parent && x.id !== c.id; });
      var row = {
        name_pt: txt(f.get("name_pt")),
        name_es: txt(f.get("name_es")),
        note_pt: txt(f.get("note_pt")),
        note_es: txt(f.get("note_es")),
        parent_id: parent,
        active: f.get("active") === "on",
      };
      if (isNew || (c.parent_id || null) !== parent) {
        row.position = siblings.reduce(function (m, x) { return Math.max(m, x.position); }, 0) + 1;
      }
      var r = isNew
        ? await run(sb.from("categories").insert(row), "Categoría creada")
        : await run(sb.from("categories").update(row).eq("id", c.id), "Categoría guardada");
      return !!r;
    }, isNew ? null : async function () {
      var subs = subCats(c.id);
      var n = countDeep(c.id);
      var extra = subs.length ? " y sus " + plural(subs.length, "subcategoría", "subcategorías") : "";
      if (!confirm("¿Eliminar “" + catName(c) + "”" + extra + " con " + plural(n, "plato", "platos") + "? No se puede deshacer.")) return;
      var paths = items
        .filter(function (i) { return i.photo_path && (i.category_id === c.id || subs.some(function (s) { return s.id === i.category_id; })); })
        .map(function (i) { return i.photo_path; });
      var r = await run(sb.from("categories").delete().eq("id", c.id), "Categoría eliminada");
      if (r) {
        if (paths.length) await sb.storage.from(BUCKET).remove(paths);
        dlg.close();
        await load();
      }
    });
  }

  function editItem(it) {
    var isNew = !it;
    var defCat = state.filter !== "all" ? state.filter : (catOrder()[0] || {}).id;
    it = it || { name_pt: "", name_es: "", desc_pt: "", desc_es: "", price: "", tags: [], available: true, photo_path: null, category_id: defCat };
    if (!cats.length) { toast("Primero creá una categoría.", true); return; }
    var newFile = null;
    var removePhoto = false;

    var preview = h("div", { class: "photo-preview" });
    function drawPreview(src) {
      preview.replaceChildren(src ? h("img", { src: src, alt: "Foto del plato" }) : h("span", { class: "none" }, icon(I.camera)));
    }
    drawPreview(it.photo_path ? photoUrl(it.photo_path) : null);

    var fileInput = h("input", { type: "file", accept: "image/*", class: "file",
      onchange: function (e) {
        newFile = e.target.files[0] || null;
        removePhoto = false;
        if (newFile) drawPreview(URL.createObjectURL(newFile));
      } });
    var removeBtn = h("button", { class: "btn ghost small", type: "button",
      onclick: function () { newFile = null; removePhoto = true; fileInput.value = ""; drawPreview(null); } }, "Quitar");

    var catSel = h("select", { name: "category_id", required: true },
      catOrder().map(function (x) { return h("option", { value: x.id, selected: x.id === it.category_id }, catLabel(x)); }));

    openDialog(isNew ? "Nuevo plato" : "Editar plato", [
      h("div", { class: "photo-field" }, preview,
        h("div", { class: "photo-btns" },
          h("label", { class: "btn small" }, it.photo_path ? "Cambiar foto" : "Agregar foto", fileInput),
          removeBtn,
          h("small", { text: "Se achica sola antes de subir. Mejor con buena luz y fondo prolijo." }))),
      field("Nombre en español", h("input", { name: "name_es", value: it.name_es || "", placeholder: "Ej: Hamburguesa cheddar" })),
      field("Nombre en portugués *", h("input", { name: "name_pt", value: it.name_pt || "", required: true, placeholder: "Ex: Hambúrguer cheddar" })),
      field("Descripción en español", h("textarea", { name: "desc_es", rows: 2 }, it.desc_es || "")),
      field("Descripción en portugués", h("textarea", { name: "desc_pt", rows: 2 }, it.desc_pt || "")),
      h("div", { class: "two" },
        field("Precio (R$) *", h("input", { name: "price", type: "number", min: "0", step: "0.01", inputmode: "decimal", required: true, value: it.price })),
        field("Categoría", catSel)),
      h("fieldset", { class: "tags-field" }, h("legend", { text: "Etiquetas" }),
        TAGS.map(function (t) {
          return h("label", { class: "pill" },
            h("input", { type: "checkbox", name: "tags", value: t.id, checked: (it.tags || []).indexOf(t.id) >= 0 }), h("span", { text: t.label }));
        })),
      h("label", { class: "check-row" }, h("span", { text: "Disponible (si no, no aparece en el menú)" }),
        h("span", { class: "switch" }, h("input", { type: "checkbox", name: "available", checked: it.available }), h("span", { class: "slider" }))),
    ], async function (f) {
      var catId = f.get("category_id");
      var row = {
        category_id: catId,
        name_pt: txt(f.get("name_pt")),
        name_es: txt(f.get("name_es")),
        desc_pt: txt(f.get("desc_pt")),
        desc_es: txt(f.get("desc_es")),
        price: Number(f.get("price")),
        tags: f.getAll("tags"),
        available: f.get("available") === "on",
      };
      if (isNew || catId !== it.category_id) {
        row.position = itemsOf(catId).reduce(function (m, x) { return Math.max(m, x.position); }, 0) + 1;
      }
      var r = isNew
        ? await run(sb.from("items").insert(row).select().single())
        : await run(sb.from("items").update(row).eq("id", it.id).select().single());
      if (!r) return false;
      var saved = r.data;
      var oldPath = it.photo_path;

      if (newFile) {
        toast("Subiendo foto…");
        var blob;
        try { blob = await resizeImage(newFile, 1200); }
        catch (e) { toast("No se pudo leer la imagen. Probá con otra foto (JPG o PNG).", true); return false; }
        var ext = blob.type === "image/webp" ? "webp" : "jpg";
        var path = "items/" + saved.id + "-" + Date.now() + "." + ext;
        var up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (up.error) { toast("No se pudo subir la foto: " + up.error.message, true); return false; }
        var r2 = await run(sb.from("items").update({ photo_path: path }).eq("id", saved.id));
        if (!r2) return false;
        if (oldPath) await sb.storage.from(BUCKET).remove([oldPath]);
      } else if (removePhoto && oldPath) {
        await run(sb.from("items").update({ photo_path: null }).eq("id", saved.id));
        await sb.storage.from(BUCKET).remove([oldPath]);
      }
      toast(isNew ? "Plato creado" : "Plato guardado");
      return true;
    }, isNew ? null : async function () {
      if (!confirm("¿Eliminar “" + (it.name_es || it.name_pt) + "”? No se puede deshacer.")) return;
      var r = await run(sb.from("items").delete().eq("id", it.id), "Plato eliminado");
      if (r) {
        if (it.photo_path) await sb.storage.from(BUCKET).remove([it.photo_path]);
        dlg.close();
        await load();
      }
    });
  }

  // Achica la foto en el navegador (las del celular pesan 3-8 MB).
  function resizeImage(file, max) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.round(img.naturalWidth * scale);
        var hh = Math.round(img.naturalHeight * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = hh;
        canvas.getContext("2d").drawImage(img, 0, 0, w, hh);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (b) {
          if (b && b.type === "image/webp") return resolve(b);
          canvas.toBlob(function (j) { j ? resolve(j) : reject(new Error("toBlob")); }, "image/jpeg", 0.85);
        }, "image/webp", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  // ---------- arranque ----------
  sb.auth.getSession().then(function (r) {
    var has = r.data && r.data.session;
    if (isRecovery && has) showRecovery();
    else if (isRecovery) { showLogin("El link para cambiar la contraseña venció o ya se usó. Pedí uno nuevo."); history.replaceState(null, "", location.pathname); }
    else if (has) enter();
    else showLogin();
  });
})();
