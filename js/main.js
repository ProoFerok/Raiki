(function () {
  const CATEGORY_LABELS = {
    important: "Важное",
    utilities: "ЖКХ",
    events: "События"
  };
  const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function parseDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? null : d;
  }

  function formatDate(iso) {
    const d = parseDate(iso);
    return d ? d.getDate() + " " + MONTHS_GEN[d.getMonth()] + " " + d.getFullYear() : iso;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  function renderMeterDeadline() {
    const day = typeof METER_DEADLINE_DAY === "number" ? METER_DEADLINE_DAY : 15;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let deadline = new Date(today.getFullYear(), today.getMonth(), day);
    if (today > deadline) deadline = new Date(today.getFullYear(), today.getMonth() + 1, day);
    const left = Math.round((deadline - today) / 86400000);

    document.getElementById("meter-deadline").textContent =
      "до " + deadline.getDate() + " " + MONTHS_GEN[deadline.getMonth()];
    document.getElementById("meter-left").textContent = left === 0
      ? "сегодня последний день"
      : "осталось " + left + " " + plural(left, "день", "дня", "дней");
  }

  // Рисунок дома: 16 этажей, 6 подъездов, кирпич, застеклённые лоджии.
  function renderFacade() {
    const FLOORS = 16, SECTIONS = 6;
    const W = 600, H = 500, GROUND = 452;
    const X0 = 36, SW = 78, X1 = X0 + SW * SECTIONS;
    const PLINTH = 28, FH = 22, PARAPET = 10;
    const TOP = GROUND - PLINTH - FLOORS * FH - PARAPET;
    const DEPTH = 40, RISE = 14;

    let seed = 11;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function r(cls, x, y, w, h, extra) {
      return '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (extra || "") + "/>";
    }
    function glassCls() {
      const v = rand();
      return "f-glass" + (v < 0.16 ? " lit" : v < 0.42 ? " n" : "");
    }
    function windowAt(x, y, w, h) {
      const g = glassCls();
      return r(g, x, y, w, h) +
        (g === "f-glass" ? r("f-hi", x + 1, y + 1, w * 0.35, h - 2) : "") +
        r("f-frame", x, y, w, h) +
        '<line class="f-frame" x1="' + (x + w / 2) + '" y1="' + y + '" x2="' + (x + w / 2) + '" y2="' + (y + h) + '"/>';
    }

    const out = [];
    out.push('<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Рисунок дома: 16 этажей, 6 подъездов">');
    out.push('<defs><linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" class="f-sky-top"/><stop offset="1" class="f-sky-bottom"/></linearGradient>' +
      '<pattern id="f-bricks" width="14" height="6" patternUnits="userSpaceOnUse">' +
      '<path class="f-brick" d="M0 6H14M0 3H14M7 0V3M0 3V6M14 3V6"/></pattern></defs>');

    // небо и облака
    out.push('<rect width="' + W + '" height="' + H + '" fill="url(#f-sky)"/>');
    out.push('<ellipse class="f-cloud" cx="90" cy="70" rx="46" ry="11"/><ellipse class="f-cloud" cx="118" cy="62" rx="28" ry="10"/>');
    out.push('<ellipse class="f-cloud" cx="560" cy="120" rx="38" ry="9"/>');

    // боковая стена для объёма
    out.push('<polygon class="f-side" points="' + X1 + "," + TOP + " " + (X1 + DEPTH) + "," + (TOP - RISE) + " " +
      (X1 + DEPTH) + "," + (GROUND - 6) + " " + X1 + "," + GROUND + '"/>');
    for (let f = 0; f < FLOORS; f++) {
      const y = TOP + PARAPET + f * FH + 5;
      const a = 12, b = 26, k = RISE / DEPTH;
      out.push('<polygon class="' + glassCls() + '" points="' +
        (X1 + a) + "," + (y - a * k) + " " + (X1 + b) + "," + (y - b * k) + " " +
        (X1 + b) + "," + (y + 12 - b * k) + " " + (X1 + a) + "," + (y + 12 - a * k) + '"/>');
    }

    // фасад: кирпич, парапет, цоколь
    out.push(r("f-wall", X0, TOP, X1 - X0, GROUND - TOP));
    out.push('<rect x="' + X0 + '" y="' + TOP + '" width="' + (X1 - X0) + '" height="' + (GROUND - TOP) + '" fill="url(#f-bricks)"/>');
    out.push(r("f-trim", X0 - 2, TOP, X1 - X0 + 4, 5));
    out.push(r("f-plinth", X0, GROUND - PLINTH, X1 - X0, PLINTH));
    out.push(r("f-trim", X0 - 1, GROUND - PLINTH - 3, X1 - X0 + 2, 3));

    for (let s = 0; s < SECTIONS; s++) {
      const x = X0 + s * SW;
      // машинное помещение лифта на крыше
      out.push(r("f-roof", x + SW / 2 - 14, TOP - 18, 28, 18));
      out.push(r("f-trim", x + SW / 2 - 16, TOP - 20, 32, 3));
      // колонна лоджий
      out.push(r("f-trim", x + 24, TOP + PARAPET - 3, 30, FLOORS * FH + 3));
      for (let f = 0; f < FLOORS; f++) {
        const y = TOP + PARAPET + f * FH;
        out.push(windowAt(x + 6, y + 5, 14, 13));
        out.push(windowAt(x + 58, y + 5, 14, 13));
        // остекление лоджии: три створки
        const g = glassCls();
        out.push(r(g, x + 26, y + 3, 26, 11));
        if (g === "f-glass") out.push(r("f-hi", x + 27, y + 4, 7, 9));
        out.push('<path class="f-frame" d="M' + (x + 34.7) + " " + (y + 3) + "V" + (y + 14) + "M" + (x + 43.3) + " " + (y + 3) + "V" + (y + 14) + '"/>');
      }
      // подъезд: козырёк, дверь, крыльцо
      const cx = x + SW / 2;
      out.push(r("f-glass", x + 8, GROUND - PLINTH + 8, 12, 8));
      out.push(r("f-glass", x + 58, GROUND - PLINTH + 8, 12, 8));
      out.push(r("f-door", cx - 7, GROUND - 22, 14, 22));
      out.push(r("f-glass n", cx - 5, GROUND - 19, 10, 6));
      out.push(r("f-canopy", cx - 13, GROUND - 27, 26, 4));
      out.push(r("f-canopy", cx - 11, GROUND, 22, 4));
    }

    // земля, тротуар
    out.push(r("f-ground", 0, GROUND, W, H - GROUND));
    out.push(r("f-path", 0, GROUND + 4, W, 9));

    // деревья во дворе
    [[X0 + SW * 1, 30], [X0 + SW * 2 + 2, 24], [X0 + SW * 4, 30], [X0 + SW * 5 - 2, 22], [14, 34], [W - 22, 40]]
      .forEach(function (t) {
        const tx = t[0], h = t[1], base = H - 22;
        out.push(r("f-trunk", tx - 2, base - h, 4, h));
        out.push('<circle class="f-tree-dark" cx="' + tx + '" cy="' + (base - h - 4) + '" r="' + (h * 0.55) + '"/>');
        out.push('<circle class="f-tree" cx="' + (tx - h * 0.25) + '" cy="' + (base - h - 10) + '" r="' + (h * 0.45) + '"/>');
        out.push('<circle class="f-tree" cx="' + (tx + h * 0.2) + '" cy="' + (base - h - 14) + '" r="' + (h * 0.38) + '"/>');
      });

    out.push("</svg>");
    document.getElementById("facade").innerHTML = out.join("");
  }

  function sortedNews() {
    return NEWS.slice().sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.date.localeCompare(a.date);
    });
  }

  function renderNews(filter) {
    const list = document.getElementById("news-list");
    const empty = document.getElementById("news-empty");
    list.replaceChildren();

    const items = sortedNews().filter(function (n) {
      return filter === "all" || n.category === filter;
    });
    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;

    items.forEach(function (n) {
      const item = el("article", "news-item" + (n.pinned ? " pinned" : ""));
      const d = parseDate(n.date);

      const date = el("time", "news-date");
      date.dateTime = n.date;
      date.title = formatDate(n.date);
      if (d) {
        date.append(el("span", "news-day", String(d.getDate())));
        date.append(el("span", "news-month", MONTHS_GEN[d.getMonth()].slice(0, 3) + " " + d.getFullYear()));
      } else {
        date.append(el("span", "news-month", n.date));
      }

      const body = el("div", "news-body");
      const tags = el("div", "news-tags");
      tags.append(el("span", "tag tag-" + n.category, CATEGORY_LABELS[n.category] || n.category));
      if (n.pinned) tags.append(el("span", "tag tag-pin", "закреплено"));
      body.append(tags, el("h3", "", n.title));
      String(n.text || "").split(/\n\s*\n/).forEach(function (p) {
        body.append(el("p", "", p));
      });

      item.append(date, body);
      list.append(item);
    });
  }

  function renderContacts() {
    const list = document.getElementById("contacts-list");
    CONTACTS.forEach(function (c) {
      const item = el("li", "phone-item");
      item.append(el("h3", "", c.title));
      if (c.phone) {
        const a = el("a", "phone-num", c.phone);
        a.href = "tel:" + c.phone.replace(/[^\d+]/g, "");
        item.append(a);
      } else {
        item.append(el("span", "phone-num pending", "уточняется"));
      }
      if (c.note) item.append(el("p", "", c.note));
      list.append(item);
    });
  }

  function renderUseful() {
    const list = document.getElementById("useful-list");
    USEFUL.forEach(function (u) {
      const item = el("li", "useful-item");
      const h = el("h3");
      if (u.link) {
        const a = el("a", "", u.title);
        a.href = u.link;
        a.target = "_blank";
        a.rel = "noopener";
        h.append(a);
      } else {
        h.textContent = u.title;
      }
      item.append(h);
      if (u.text) item.append(el("p", "", u.text));
      list.append(item);
    });
  }

  function setupFilters() {
    const chips = document.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        renderNews(chip.dataset.filter);
      });
    });
  }

  function setupMenu() {
    const toggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav");
    toggle.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  renderMeterDeadline();
  renderFacade();
  renderNews("all");
  renderContacts();
  renderUseful();
  setupFilters();
  setupMenu();
  document.getElementById("updated").textContent = formatDate(LAST_UPDATED);
})();
