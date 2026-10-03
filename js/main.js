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

  function renderFacade() {
    const facade = document.getElementById("facade");
    const FLOORS = 16, ENTRANCES = 6, COLS = 3;
    let seed = 7;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    for (let e = 0; e < ENTRANCES; e++) {
      const entrance = el("div", "entrance");
      for (let f = 0; f < FLOORS; f++) {
        for (let c = 0; c < COLS; c++) {
          entrance.append(el("span", "win" + (rand() < 0.32 ? " lit" : "")));
        }
      }
      entrance.append(el("span", "door"));
      facade.append(entrance);
    }
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
