(function () {
  "use strict";

  var C = window.CONFIG || {};
  var BUCKET = "menu-photos";
  var TAGS = [
    { id: "casa", label: "De la casa" },
    { id: "artesanal", label: "Artesanal" },
    { id: "novo", label: "Nuevo" },
  ];

  var $ = function (s) { return document.querySelector(s); };

  // Crea elementos sin usar innerHTML (todo texto va como textContent).
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

  var toastTimer;
  function toast(msg, isError) {
    var t = $("#toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, isError ? 6000 : 2200);
  }

  function show(view) {
    ["setup", "login", "app"].forEach(function (v) { $("#view-" + v).hidden = v !== view; });
    $("#session-actions").hidden = view !== "app";
  }

  function money(n) { return "R$ " + Number(n).toFixed(2).replace(".", ","); }
  function byPos(a, b) { return a.position - b.position; }

  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) {
    show("setup");
    return;
  }

  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  var cats = [];
  var items = [];
  var selected = null;

  function topCats() { return cats.filter(function (c) { return !c.parent_id; }).sort(byPos); }
  function subCats(id) { return cats.filter(function (c) { return c.parent_id === id; }).sort(byPos); }
  function itemsOf(id) { return items.filter(function (i) { return i.category_id === id; }).sort(byPos); }
  function catLabel(c) {
    var name = c.name_es || c.name_pt;
    if (!c.parent_id) return name;
    var p = cats.find(function (x) { return x.id === c.parent_id; });
    return (p ? (p.name_es || p.name_pt) + " › " : "") + name;
  }
  function photoUrl(path) { return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }

  // ---------- sesión ----------
  function showLogin(msg) {
    show("login");
    $("#login-error").textContent = msg || "";
  }

  async function enter() {
    var u = await sb.auth.getUser();
    var user = u.data && u.data.user;
    if (!user) return showLogin();
    var r = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (r.error || !r.data) {
      await sb.auth.signOut();
      return showLogin("Este usuario no tiene permiso para editar el menú.");
    }
    show("app");
    await load();
  }

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = new FormData(e.target);
    var btn = e.target.querySelector("button");
    btn.disabled = true;
    $("#login-error").textContent = "";
    var r = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
    btn.disabled = false;
    if (r.error) {
      $("#login-error").textContent = "Email o contraseña incorrectos.";
      return;
    }
    await enter();
  });

  $("#logout").addEventListener("click", async function () {
    await sb.auth.signOut();
    showLogin();
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
    if (!selected || !cats.some(function (c) { return c.id === selected; })) {
      selected = topCats().length ? topCats()[0].id : null;
    }
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
        onclick: function () { move(rec, siblings, table, -1); } }, "↑"),
      h("button", { class: "icon-btn", type: "button", "aria-label": "Bajar", title: "Bajar", disabled: i === siblings.length - 1,
        onclick: function () { move(rec, siblings, table, 1); } }, "↓"));
  }

  // ---------- render ----------
  function render() {
    renderCats();
    renderItems();
  }

  function catRow(c, siblings, isSub) {
    var n = itemsOf(c.id).length;
    var meta = n + (n === 1 ? " plato" : " platos") + (c.active ? "" : " · oculta");
    return h("div", { class: "row" + (isSub ? " sub" : "") + (c.id === selected ? " selected" : "") + (c.active ? "" : " off") },
      h("button", { class: "row-main", type: "button", onclick: function () { selected = c.id; render(); scrollToItems(); } },
        h("strong", { text: c.name_es || c.name_pt }),
        h("small", { text: meta })),
      moveBtns(c, siblings, "categories"),
      h("button", { class: "icon-btn", type: "button", "aria-label": "Editar " + (c.name_es || c.name_pt), title: "Editar",
        onclick: function () { editCat(c); } }, "✎"));
  }

  function renderCats() {
    var list = $("#cat-list");
    list.replaceChildren();
    var tops = topCats();
    if (!tops.length) list.appendChild(h("p", { class: "empty", text: "Todavía no hay categorías." }));
    tops.forEach(function (c) {
      list.appendChild(catRow(c, tops, false));
      var subs = subCats(c.id);
      subs.forEach(function (s) { list.appendChild(catRow(s, subs, true)); });
    });
  }

  function scrollToItems() {
    if (window.matchMedia("(max-width: 860px)").matches) $("#items").scrollIntoView({ behavior: "smooth" });
  }

  function renderItems() {
    var box = $("#items");
    box.replaceChildren();
    var cat = cats.find(function (c) { return c.id === selected; });
    if (!cat) {
      box.appendChild(h("p", { class: "empty", text: "Creá una categoría para empezar a cargar platos." }));
      return;
    }
    box.appendChild(h("div", { class: "panel-head" },
      h("h2", { text: catLabel(cat) }),
      h("button", { class: "btn", type: "button", onclick: function () { editItem(null); } }, "+ Plato")));
    var list = itemsOf(cat.id);
    if (!list.length) {
      var subs = subCats(cat.id);
      box.appendChild(h("p", { class: "empty", text: subs.length
        ? "Esta categoría tiene subcategorías: elegí una en la lista para ver sus platos."
        : "Todavía no hay platos en esta categoría." }));
    }
    var wrap = h("div", { class: "list" });
    list.forEach(function (it) {
      wrap.appendChild(h("div", { class: "row item-row" + (it.available ? "" : " off") },
        it.photo_path
          ? h("img", { class: "thumb", src: photoUrl(it.photo_path), alt: "", loading: "lazy" })
          : h("span", { class: "thumb none", "aria-hidden": "true" }, "📷"),
        h("button", { class: "row-main", type: "button", onclick: function () { editItem(it); } },
          h("strong", { text: it.name_es || it.name_pt }),
          h("small", { text: money(it.price) + (it.available ? "" : " · sin stock") })),
        h("label", { class: "switch", title: it.available ? "Disponible" : "Sin stock" },
          h("input", { type: "checkbox", checked: it.available, "aria-label": "Disponible",
            onchange: async function (e) {
              await run(sb.from("items").update({ available: e.target.checked }).eq("id", it.id),
                e.target.checked ? "Disponible" : "Marcado sin stock");
              await load();
            } }),
          h("span", { class: "slider" })),
        moveBtns(it, list, "items")));
    });
    box.appendChild(wrap);
  }

  // ---------- diálogos ----------
  var dlg = $("#dlg");

  function field(label, input, hint) {
    return h("label", { class: "fld" }, h("span", { text: label }), input, hint ? h("small", { text: hint }) : null);
  }

  function openDialog(title, formChildren, onSubmit, onDelete) {
    var form = h("form", { class: "form", method: "dialog" },
      h("h2", { text: title }),
      formChildren,
      h("div", { class: "dlg-actions" },
        onDelete ? h("button", { class: "btn danger", type: "button", onclick: onDelete }, "Eliminar") : h("span"),
        h("span", { class: "spacer" }),
        h("button", { class: "btn ghost", type: "button", onclick: function () { dlg.close(); } }, "Cancelar"),
        h("button", { class: "btn", type: "submit" }, "Guardar")));
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btns = form.querySelectorAll("button");
      btns.forEach(function (b) { b.disabled = true; });
      var ok = await onSubmit(new FormData(form), form);
      btns.forEach(function (b) { b.disabled = false; });
      if (ok) { dlg.close(); await load(); }
    });
    dlg.replaceChildren(form);
    dlg.showModal();
    var first = form.querySelector("input, textarea, select");
    if (first) first.focus();
  }

  function txt(v) { v = (v || "").trim(); return v || null; }

  function editCat(c) {
    var isNew = !c;
    c = c || { name_pt: "", name_es: "", note_pt: "", note_es: "", parent_id: null, active: true };
    var hasSubs = !isNew && subCats(c.id).length > 0;
    var parentSel = h("select", { name: "parent_id", disabled: hasSubs },
      h("option", { value: "" }, "— Ninguna (es una categoría principal) —"),
      topCats().filter(function (p) { return p.id !== c.id; }).map(function (p) {
        return h("option", { value: p.id, selected: p.id === c.parent_id }, p.name_es || p.name_pt);
      }));
    if (!isNew && !c.parent_id) parentSel.value = "";

    openDialog(isNew ? "Nueva categoría" : "Editar categoría", [
      field("Nombre en español", h("input", { name: "name_es", value: c.name_es || "", placeholder: "Ej: Hamburguesas" })),
      field("Nombre en portugués *", h("input", { name: "name_pt", value: c.name_pt || "", required: true, placeholder: "Ex: Hambúrgueres" })),
      field("Nota en español", h("input", { name: "note_es", value: c.note_es || "", placeholder: "Ej: Todas con papas fritas" }), "Opcional, aparece debajo del título."),
      field("Nota en portugués", h("input", { name: "note_pt", value: c.note_pt || "", placeholder: "Ex: Todos com batata frita" })),
      field("Dentro de", parentSel, hasSubs
        ? "Tiene subcategorías, así que tiene que seguir siendo principal."
        : "Elegí una categoría si querés que esta sea una subcategoría (ej: Cervezas › Porrón)."),
      h("label", { class: "check" }, h("input", { type: "checkbox", name: "active", checked: c.active }), " Visible en el menú"),
    ], async function (f) {
      var parent = f.get("parent_id") || null;
      if (hasSubs) parent = null;
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
        ? await run(sb.from("categories").insert(row).select().single(), "Categoría creada")
        : await run(sb.from("categories").update(row).eq("id", c.id), "Categoría guardada");
      if (r && isNew) selected = r.data.id;
      return !!r;
    }, isNew ? null : async function () {
      var n = itemsOf(c.id).length;
      var subs = subCats(c.id);
      var extra = subs.length ? " y sus " + subs.length + " subcategorías" : "";
      if (!confirm("¿Eliminar \"" + (c.name_es || c.name_pt) + "\"" + extra + " con " + n + " platos? No se puede deshacer.")) return;
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
    it = it || { name_pt: "", name_es: "", desc_pt: "", desc_es: "", price: "", tags: [], available: true, photo_path: null, category_id: selected };
    var newFile = null;
    var removePhoto = false;

    var preview = h("div", { class: "photo-preview" });
    function drawPreview(src) {
      preview.replaceChildren(src
        ? h("img", { src: src, alt: "Foto del plato" })
        : h("span", { class: "none", text: "Sin foto" }));
    }
    drawPreview(it.photo_path ? photoUrl(it.photo_path) : null);

    var fileInput = h("input", { type: "file", accept: "image/*", class: "file",
      onchange: function (e) {
        newFile = e.target.files[0] || null;
        removePhoto = false;
        if (newFile) drawPreview(URL.createObjectURL(newFile));
      } });
    var removeBtn = h("button", { class: "btn ghost small", type: "button",
      onclick: function () { newFile = null; removePhoto = true; fileInput.value = ""; drawPreview(null); } }, "Quitar foto");

    var catSel = h("select", { name: "category_id", required: true },
      topCats().map(function (c) {
        return [c].concat(subCats(c.id)).map(function (x) {
          return h("option", { value: x.id, selected: x.id === it.category_id }, catLabel(x));
        });
      }));

    openDialog(isNew ? "Nuevo plato" : "Editar plato", [
      h("div", { class: "photo-field" }, preview,
        h("div", { class: "photo-btns" },
          h("label", { class: "btn small" }, "Elegir foto", fileInput),
          removeBtn,
          h("small", { text: "Se achica sola antes de subir. Mejor foto horizontal o cuadrada, con buena luz." }))),
      field("Nombre en español", h("input", { name: "name_es", value: it.name_es || "", placeholder: "Ej: Hamburguesa cheddar" })),
      field("Nombre en portugués *", h("input", { name: "name_pt", value: it.name_pt || "", required: true, placeholder: "Ex: Hambúrguer cheddar" })),
      field("Descripción en español", h("textarea", { name: "desc_es", rows: 2 }, it.desc_es || "")),
      field("Descripción en portugués", h("textarea", { name: "desc_pt", rows: 2 }, it.desc_pt || "")),
      h("div", { class: "two" },
        field("Precio (R$) *", h("input", { name: "price", type: "number", min: "0", step: "0.01", inputmode: "decimal", required: true, value: it.price })),
        field("Categoría", catSel)),
      h("fieldset", { class: "tags" }, h("legend", { text: "Etiquetas" }),
        TAGS.map(function (t) {
          return h("label", { class: "check" },
            h("input", { type: "checkbox", name: "tags", value: t.id, checked: (it.tags || []).indexOf(t.id) >= 0 }), " " + t.label);
        })),
      h("label", { class: "check" }, h("input", { type: "checkbox", name: "available", checked: it.available }), " Disponible (si no, no aparece en el menú)"),
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
      selected = catId;
      return true;
    }, isNew ? null : async function () {
      if (!confirm("¿Eliminar \"" + (it.name_es || it.name_pt) + "\"? No se puede deshacer.")) return;
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

  $("#add-cat").addEventListener("click", function () { editCat(null); });

  // ---------- mi cuenta: cambiar email y contraseña ----------
  async function currentEmail() {
    var u = await sb.auth.getUser();
    return u.data && u.data.user ? u.data.user.email : "";
  }

  // Confirma la contraseña actual antes de cambiar algo sensible.
  async function checkPassword(email, pw) {
    var r = await sb.auth.signInWithPassword({ email: email, password: pw });
    return !r.error;
  }

  async function openAccount() {
    var email = await currentEmail();

    var emailErr = h("p", { class: "form-error", role: "alert" });
    var emailForm = h("form", { class: "form account-block" },
      h("h3", { text: "Cambiar email" }),
      field("Email nuevo", h("input", { name: "email", type: "email", required: true, autocomplete: "email" })),
      field("Contraseña actual", h("input", { name: "current", type: "password", required: true, autocomplete: "current-password" })),
      emailErr,
      h("button", { class: "btn", type: "submit" }, "Cambiar email"));
    emailForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = new FormData(emailForm);
      var next = String(f.get("email")).trim();
      emailErr.textContent = "";
      if (next.toLowerCase() === email.toLowerCase()) { emailErr.textContent = "Es el mismo email que ya usás."; return; }
      var btn = emailForm.querySelector("button"); btn.disabled = true;
      if (!(await checkPassword(email, f.get("current")))) {
        btn.disabled = false;
        emailErr.textContent = "La contraseña actual no es correcta.";
        return;
      }
      var r = await sb.auth.updateUser({ email: next }, { emailRedirectTo: location.origin + location.pathname });
      btn.disabled = false;
      if (r.error) { emailErr.textContent = "No se pudo cambiar: " + r.error.message; return; }
      dlg.close();
      toast("Te mandamos un mail a " + next + " para confirmar. Hasta que lo confirmes, seguís entrando con " + email + ".");
    });

    var passErr = h("p", { class: "form-error", role: "alert" });
    var passForm = h("form", { class: "form account-block" },
      h("h3", { text: "Cambiar contraseña" }),
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
      if (!(await checkPassword(email, f.get("current")))) {
        btn.disabled = false;
        passErr.textContent = "La contraseña actual no es correcta.";
        return;
      }
      var r = await sb.auth.updateUser({ password: f.get("next") });
      btn.disabled = false;
      if (r.error) { passErr.textContent = "No se pudo cambiar: " + r.error.message; return; }
      dlg.close();
      toast("Contraseña actualizada");
    });

    dlg.replaceChildren(h("div", { class: "account" },
      h("div", { class: "panel-head" },
        h("h2", { text: "Mi cuenta" }),
        h("button", { class: "icon-btn", type: "button", "aria-label": "Cerrar", onclick: function () { dlg.close(); } }, "✕")),
      h("p", { class: "hint" }, "Entrás con: ", h("strong", { text: email })),
      emailForm,
      passForm));
    dlg.showModal();
  }

  $("#account").addEventListener("click", openAccount);

  // ---------- arranque ----------
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) enter();
    else showLogin();
  });
})();
