/* Guardians of the Alleyway: issue list and page reader.
   Only released issues have pages in this repository. Locked issues are listed by number and title only. */
const ISSUES = [
  { n: 1, title: "Born on 39th Street", pages: 11, released: true },
  { n: 2, title: "Bad Blood" },
  { n: 3, title: "Fright Night" },
  { n: 4, title: "MAol" },
  { n: 5, title: "MAol Returns" },
  { n: 6, title: "Packed Lunch" },
  { n: 7, title: "Breaking News" },
  { n: 8, title: "The Trail" },
  { n: 9, title: "Unmasked" },
  { n: 10, title: "The Truth" },
  { n: 11, title: "The Reveal" },
];

const pad = (n) => String(n).padStart(2, "0");
const pageSrc = (issue, p) => `issues/${pad(issue.n)}/${pad(p)}.jpg`;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable: fine */ } },
};

/* ---------- Shelf (index.html) ---------- */
function renderShelf() {
  const shelf = document.getElementById("shelf");
  if (!shelf) return;
  shelf.innerHTML = ISSUES.map((is) => {
    if (!is.released) {
      return `<div class="card locked" aria-label="Issue ${is.n}, ${is.title}, coming soon">
        <div class="lockart"><span class="lock"></span><span class="soon">Coming soon</span></div>
        <div class="meta"><span class="num">Issue ${is.n}</span><span class="ttl">${is.title}</span></div></div>`;
    }
    const saved = parseInt(store.get(`gota-progress-${is.n}`) || "0", 10);
    const cont = saved > 0 && saved < is.pages - 1;
    return `<a class="card" href="read.html?issue=${is.n}${cont ? `&page=${saved}` : ""}">
      <img src="${is.n === 1 ? "assets/cover-01-thumb.jpg" : pageSrc(is, 0)}" alt="Issue ${is.n} cover: ${is.title}" loading="lazy">
      <div class="meta"><span class="num">Issue ${is.n}</span><span class="ttl">${is.title}</span>
      <span class="cta">${cont ? `Continue from page ${saved}` : "Read now"}</span></div></a>`;
  }).join("");
}

/* ---------- Reader (read.html) ---------- */
function renderReader() {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const qs = new URLSearchParams(location.search);
  const issue = ISSUES.find((i) => i.n === parseInt(qs.get("issue") || "1", 10) && i.released) || ISSUES[0];
  const last = issue.pages - 1;
  let page = Math.min(Math.max(parseInt(qs.get("page") || "0", 10) || 0, 0), last + 1); // last + 1 = end screen
  const img = document.getElementById("page");
  const label = document.getElementById("label");
  const endScreen = document.getElementById("end");
  const prev = document.getElementById("prev"), next = document.getElementById("next");
  document.getElementById("issueTitle").textContent = `Issue ${issue.n}: ${issue.title}`;
  document.title = `Issue ${issue.n}: ${issue.title} | Guardians of the Alleyway`;

  const nextIssue = ISSUES.find((i) => i.n === issue.n + 1);
  endScreen.querySelector(".next-issue").innerHTML = nextIssue
    ? (nextIssue.released
        ? `<a class="btn" href="read.html?issue=${nextIssue.n}">Read Issue ${nextIssue.n}: ${nextIssue.title}</a>`
        : `<p class="soon-line">Next: <b>Issue ${nextIssue.n}: ${nextIssue.title}</b>, coming soon.</p>`)
    : `<p class="soon-line">You're all caught up!</p>`;

  function show() {
    const atEnd = page > last;
    endScreen.hidden = !atEnd;
    img.hidden = atEnd;
    if (!atEnd) {
      img.src = pageSrc(issue, page);
      img.alt = page === 0 ? `Issue ${issue.n} cover` : `Issue ${issue.n}, page ${page}`;
      if (page < last) { const pre = new Image(); pre.src = pageSrc(issue, page + 1); }
      store.set(`gota-progress-${issue.n}`, String(page));
    } else {
      store.set(`gota-progress-${issue.n}`, "0");
    }
    label.textContent = atEnd ? "The end" : page === 0 ? "Cover" : `Page ${page} of ${last}`;
    prev.disabled = page === 0;
    next.disabled = atEnd;
    history.replaceState(null, "", `read.html?issue=${issue.n}&page=${page}`);
    window.scrollTo({ top: 0 });
  }
  const go = (d) => { const np = page + d; if (np >= 0 && np <= last + 1) { page = np; show(); } };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "d") go(1);
    if (e.key === "ArrowLeft" || e.key === "a") go(-1);
  });
  // Tap the right or left side of the page to turn it
  img.addEventListener("click", (e) => {
    const r = img.getBoundingClientRect();
    go(e.clientX - r.left > r.width / 2 ? 1 : -1);
  });
  // Swipe on phones
  let sx = null;
  stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    sx = null;
  });
  show();
}

renderShelf();
renderReader();
