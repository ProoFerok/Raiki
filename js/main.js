(function () {
  const CATEGORY_LABELS = {
    important: "Важное",
    utilities: "ЖКХ",
    events: "События"
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
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

    items.forEach(function (n) {
      const card = el("article", "news-card" + (n.pinned ? " pinned" : ""));
      const meta = el("div", "news-meta");
      meta.append(el("span", "tag tag-" + n.category, CATEGORY_LABELS[n.category] || n.category));
      if (n.pinned) meta.append(el("span", "tag tag-pin", "Закреплено"));
      meta.append(el("time", "news-date", formatDate(n.date)));
      card.append(meta, el("h3", "", n.title));
      String(n.text || "").split(/\n\s*\n/).forEach(function (p) {
        card.append(el("p", "", p));
      });
      list.append(card);
    });
  }

  function renderContacts() {
    const list = document.getElementById("contacts-list");
    CONTACTS.forEach(function (c) {
      const card = el("div", "card");
      card.append(el("h3", "", c.title));
      if (c.phone) {
        const a = el("a", "phone", c.phone);
        a.href = "tel:" + c.phone.replace(/[^\d+]/g, "");
        card.append(a);
      } else {
        card.append(el("span", "phone phone-pending", "уточняется"));
      }
      if (c.note) card.append(el("p", "muted", c.note));
      list.append(card);
    });
  }

  function renderUseful() {
    const list = document.getElementById("useful-list");
    USEFUL.forEach(function (u) {
      const card = el("div", "card");
      card.append(el("h3", "", u.title));
      if (u.text) card.append(el("p", "", u.text));
      if (u.link) {
        const a = el("a", "card-link", "Перейти →");
        a.href = u.link;
        a.target = "_blank";
        a.rel = "noopener";
        card.append(a);
      }
      list.append(card);
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
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".nav");
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

  renderNews("all");
  renderContacts();
  renderUseful();
  setupFilters();
  setupMenu();
  document.getElementById("updated").textContent = formatDate(LAST_UPDATED);
})();
