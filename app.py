import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
import urllib.request
import html

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "http://www.w3.org/2005/Atom"


def fetch_release_notes():
    """Fetch and parse the BigQuery Atom release notes feed."""
    req = urllib.request.Request(
        FEED_URL,
        headers={"User-Agent": "BQ-Release-Notes-Viewer/1.0"},
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    entries = []

    for entry in root.findall(f"{{{ATOM_NS}}}entry"):
        title_el = entry.find(f"{{{ATOM_NS}}}title")
        updated_el = entry.find(f"{{{ATOM_NS}}}updated")
        link_el = entry.find(f"{{{ATOM_NS}}}link[@rel='alternate']")
        content_el = entry.find(f"{{{ATOM_NS}}}content")
        id_el = entry.find(f"{{{ATOM_NS}}}id")

        title = title_el.text if title_el is not None else "Untitled"
        updated = updated_el.text if updated_el is not None else ""
        link = link_el.get("href") if link_el is not None else "#"
        content_raw = content_el.text if content_el is not None else ""
        entry_id = id_el.text if id_el is not None else ""

        # Strip the CDATA wrapper if present (ET usually handles it,
        # but the text might still be raw HTML)
        content_html = content_raw.strip() if content_raw else ""

        entries.append(
            {
                "id": entry_id,
                "title": title,
                "updated": updated,
                "link": link,
                "content": content_html,
            }
        )

    return entries


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    try:
        entries = fetch_release_notes()
        return jsonify({"status": "ok", "entries": entries})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
