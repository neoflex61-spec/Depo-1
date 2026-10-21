#!/usr/bin/env python3
"""Splices the vendored three.js source into artifact_template.html to produce
the self-contained artifact.html (the file published via the Artifact tool).

Run from anywhere:
    python3 render/src/build_artifact.py
"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
RENDER_DIR = HERE.parent

template = (HERE / "artifact_template.html").read_text(encoding="utf-8")
three_src = (RENDER_DIR / "vendor" / "three.min.js").read_text(encoding="utf-8")

out = template.replace("__THREE_JS_SOURCE__", three_src)
out_path = RENDER_DIR / "artifact.html"
out_path.write_text(out, encoding="utf-8")
print(f"Wrote {out_path} ({len(out)} bytes)")
