/* Renders the site from the JSON files in data/.
 *
 * Every page hand-writes its own nav and headings; this script only fills the
 * containers marked with a data-render attribute. Paths are relative so the
 * site works under a /homepage/ subpath and would still work at a root domain.
 */

const DATA = ["site", "publications", "topics", "questions"];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

const el = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content;
};

/* ---------- publication rendering ---------- */

function authorList(pub, selfName) {
  const names = pub.authors
    .map((a) => (a === selfName ? `<strong>${esc(a)}</strong>` : esc(a)))
    .join(", ");
  return pub.etAl ? `${names}, et al.` : names;
}

function linkRow(pub) {
  const { arxiv, doi, code } = pub.links || {};
  const parts = [];
  if (doi) parts.push(`<a href="${esc(doi)}">journal</a>`);
  if (arxiv) parts.push(`<a href="${esc(arxiv)}">arXiv</a>`);
  if (code) parts.push(`<a href="${esc(code)}">code</a>`);
  if (!parts.length) return "";
  return `<span class="links">${parts.join('<span class="sep">·</span>')}</span>`;
}

function pubEntry(pub, selfName) {
  const venue = `<span class="venue">${esc(pub.venue)}</span>`
    + (pub.ref ? ` <span class="ref">${esc(pub.ref)}</span>` : "");
  return `
    <li class="pub" id="${esc(pub.id)}">
      <div class="pub-title">${esc(pub.title)}</div>
      <div class="pub-authors">${authorList(pub, selfName)}</div>
      <div class="pub-meta">
        ${venue}
        <span class="year">${esc(pub.year)}</span>
        ${linkRow(pub)}
      </div>
    </li>`;
}

/* A compact one-line reference, used inside question cards. */
function pubRef(pub, selfName) {
  const href = pub.links.doi || pub.links.arxiv || pub.links.code;
  const title = href
    ? `<a href="${esc(href)}">${esc(pub.title)}</a>`
    : esc(pub.title);
  return `
    <li class="pub-ref">
      ${title}
      <span class="pub-ref-meta">${esc(pub.venue)}, ${esc(pub.year)}</span>
    </li>`;
}

/* ---------- section renderers ---------- */

const renderers = {
  hero(node, { site }) {
    const photo = site.photo
      ? `<img class="hero-photo" src="${esc(site.photo)}" alt="${esc(site.name)}"
             width="640" height="640">`
      : "";
    // Photo first: a right float only rises to the top if it precedes the text.
    node.append(el(`
      ${photo}
      <div class="hero-text">
        <h1>${esc(site.name)}${site.nameZh ? ` <span class="name-zh">${esc(site.nameZh)}</span>` : ""}</h1>
        <p class="role">${esc(site.role)}, ${esc(site.affiliation)}</p>
        <p class="tagline">${esc(site.tagline)}</p>
      </div>
    `));
  },

  about(node, { site }) {
    node.append(el(site.bio.map((p) => `<p>${p}</p>`).join("")));
  },

  questions(node, { site, publications, questions }) {
    const byId = Object.fromEntries(publications.map((p) => [p.id, p]));
    node.append(el(questions.map((q) => `
      <article class="question">
        <h3>${esc(q.question)}</h3>
        <p>${esc(q.answer)}</p>
        <ul class="pub-refs">
          ${q.papers.map((id) => pubRef(byId[id], site.selfName)).join("")}
        </ul>
      </article>
    `).join("")));
  },

  topics(node, { site, publications, topics }) {
    const papers = publications.filter((p) => p.type !== "talk");
    node.append(el(topics.map((t) => {
      const items = papers
        .filter((p) => p.topic === t.id)
        .sort((a, b) => b.year - a.year);
      return `
        <section class="topic" id="${esc(t.id)}">
          <h2>${esc(t.name)} <span class="count">${items.length}</span></h2>
          <p class="topic-blurb">${esc(t.blurb)}</p>
          <ul class="pubs">${items.map((p) => pubEntry(p, site.selfName)).join("")}</ul>
        </section>`;
    }).join("")));
  },

  "topic-nav"(node, { publications, topics }) {
    const papers = publications.filter((p) => p.type !== "talk");
    node.append(el(topics.map((t) => {
      const n = papers.filter((p) => p.topic === t.id).length;
      return `<a href="#${esc(t.id)}">${esc(t.name)} <span class="count">${n}</span></a>`;
    }).join("")));
  },

  talks(node, { site, publications }) {
    const items = publications
      .filter((p) => p.type === "talk")
      .sort((a, b) => b.year - a.year);
    node.append(el(`<ul class="pubs">${
      items.map((p) => pubEntry(p, site.selfName)).join("")
    }</ul>`));
  },

  software(node, { site, publications }) {
    const byId = Object.fromEntries(publications.map((p) => [p.id, p]));
    node.append(el(site.software.map((s) => {
      const paper = s.paper ? byId[s.paper] : null;
      return `
        <article class="software">
          <h3><a href="${esc(s.url)}">${esc(s.name)}</a></h3>
          <p>${esc(s.description)}</p>
          ${paper ? `<p class="accompanies">Accompanies:
            <a href="publications.html#${esc(paper.id)}">${esc(paper.title)}</a></p>` : ""}
        </article>`;
    }).join("")));
  },

  news(node, { site }) {
    node.append(el(`<ul class="news">${site.news.map((n) => `
      <li><span class="news-date">${esc(n.date)}</span><span>${n.text}</span></li>
    `).join("")}</ul>`));
  },

  contact(node, { site }) {
    const { scholar, github, orcid, cv } = site.links;
    const links = [
      ["Email", `mailto:${site.email}`, site.email],
      ["Google Scholar", scholar, "Google Scholar"],
      ["GitHub", github, "GitHub"],
      ["ORCID", orcid, "ORCID"],
      ["CV", cv, "CV (PDF)"],
    ].filter(([, href]) => href);
    node.append(el(`<ul class="contact">${links.map(
      ([, href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`
    ).join("")}</ul>`));
  },
};

/* ---------- boot ---------- */

async function main() {
  const entries = await Promise.all(
    DATA.map(async (name) => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`data/${name}.json: ${res.status}`);
      return [name, await res.json()];
    })
  );
  const data = Object.fromEntries(entries);

  for (const node of document.querySelectorAll("[data-render]")) {
    const fn = renderers[node.dataset.render];
    if (fn) fn(node, data);
    else console.warn(`no renderer for "${node.dataset.render}"`);
  }

  // Deep links into a publication should land on it, not above it.
  if (location.hash) {
    document.getElementById(location.hash.slice(1))
      ?.scrollIntoView({ block: "center" });
  }
}

main().catch((err) => {
  console.error(err);
  // One message, on the first empty slot — not repeated in every container.
  const first = document.querySelector("[data-render]");
  if (first) {
    first.innerHTML = '<p class="error">Could not load site data. '
      + 'If you are viewing this from a <code>file://</code> URL, serve it over '
      + 'HTTP instead: <code>python3 -m http.server</code></p>';
  }
});
