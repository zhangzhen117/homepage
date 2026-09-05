# Zhen Zhang — research homepage

A zero-build static site. No npm, no Ruby, no build step: the HTML pages are
hand-written and `assets/site.js` renders the content from the JSON files in
`data/`.

## Adding a publication

Add one object to `data/publications.json`:

```json
{
  "id": "zhang2027-something",
  "title": "…",
  "authors": ["Z. Zhang", "G. E. Karniadakis"],
  "venue": "Journal of Fluid Mechanics",
  "ref": "1040, A3",
  "year": 2027,
  "type": "journal",
  "topic": "turbulence-closure",
  "links": { "arxiv": null, "doi": null, "code": null },
  "bibtex": ""
}
```

- `type` is `journal`, `conference`, `preprint`, or `talk`. Talks render on
  `talks.html`; everything else on `publications.html`.
- `topic` must match an `id` in `data/topics.json`.
- Set `"etAl": true` when the author list is truncated.
- `Z. Zhang` is bolded automatically — do not add markup to author names.

To feature a paper as a research question, add its `id` to an entry in
`data/questions.json`. A paper belongs to exactly one topic but can appear in
any number of questions.

Bio, news, profile links and the software list live in `data/site.json`.

## Checking and previewing

```sh
python3 tools/check.py          # verifies every ID reference resolves
python3 -m http.server 8000     # then open http://localhost:8000/
```

`site.js` uses `fetch`, so preview over HTTP — opening `index.html` as a
`file://` URL will not load the data.

Run `tools/check.py` before every push. It catches the failure this layout is
prone to: a question or software entry pointing at a publication ID that no
longer exists.

## Deploying

GitHub Pages, served from the repository root. All paths are relative, so the
site works at `zhangzhen117.github.io/homepage/` and would still work unchanged
at a root domain if the repo is later renamed to `zhangzhen117.github.io`.

`.nojekyll` stops Pages from running Jekyll over the files.
