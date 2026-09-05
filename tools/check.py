#!/usr/bin/env python3
"""Integrity check for the site data files.

The site keeps one publication list and references it by ID from topics and
questions. Those references are the one thing that can break silently, so check
them before every push:

    python3 tools/check.py
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

errors = []


def load(name):
    path = DATA / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing data file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        errors.append(f"{name} is not valid JSON: {exc}")
    return None


pubs = load("publications.json")
topics = load("topics.json")
questions = load("questions.json")
site = load("site.json")

if errors:
    for e in errors:
        print(f"FAIL  {e}")
    sys.exit(1)

pub_ids = [p["id"] for p in pubs]
topic_ids = [t["id"] for t in topics]

# Unique IDs.
for ids, label in ((pub_ids, "publication"), (topic_ids, "topic")):
    seen = set()
    for i in ids:
        if i in seen:
            errors.append(f"duplicate {label} id: {i}")
        seen.add(i)

# Every publication points at a real topic.
for p in pubs:
    if p["topic"] not in topic_ids:
        errors.append(f"publication {p['id']} has unknown topic {p['topic']!r}")

# Every topic has at least one publication.
for t in topics:
    if not any(p["topic"] == t["id"] for p in pubs):
        errors.append(f"topic {t['id']} has no publications")

# Every question references real publications.
for q in questions:
    if not q["papers"]:
        errors.append(f"question {q['id']} references no papers")
    for pid in q["papers"]:
        if pid not in pub_ids:
            errors.append(f"question {q['id']} references unknown paper {pid!r}")

# Software entries reference real publications, when they reference one at all.
for s in site.get("software", []):
    if s.get("paper") and s["paper"] not in pub_ids:
        errors.append(f"software {s['name']} references unknown paper {s['paper']!r}")

# The self-name must appear in each publication's author list, or the renderer
# silently stops bolding it.
self_name = site["selfName"]
for p in pubs:
    if self_name not in p["authors"] and not p.get("etAl"):
        errors.append(f"publication {p['id']} does not list {self_name!r} as an author")

if errors:
    for e in errors:
        print(f"FAIL  {e}")
    sys.exit(1)

papers = [p for p in pubs if p["type"] != "talk"]
talks = [p for p in pubs if p["type"] == "talk"]
print(f"OK  {len(papers)} papers, {len(talks)} talks, {len(topics)} topics, "
      f"{len(questions)} questions")
for t in topics:
    n = sum(1 for p in pubs if p["topic"] == t["id"])
    print(f"    {n:2d}  {t['name']}")
