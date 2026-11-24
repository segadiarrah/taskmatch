"""Read-only, no-JavaScript public preview check. Uses GET requests and no account.

python3 tools/journey-tests/public_previews.py https://taskmatch.ai
python3 tools/journey-tests/public_previews.py http://127.0.0.1:3137
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
import subprocess
from urllib.parse import parse_qs, urlencode, urlsplit

LOCALES = {"en": "en_US", "fr": "fr_FR", "zh": "zh_CN", "es": "es_ES", "pt": "pt_BR"}
INTENTS = ("project", "work", "executor", "mission", "agent", "delegation")
PAGES = ("/", "/pricing", "/resources/documentation", "/resources/api-reference", "/resources/sdk", "/resources/guides")


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = self.title = self.canonical = ""
        self.alternates, self.meta = {}, {}
        self.in_head = self.in_title = self.form = self.selector = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang", "")
        elif tag == "head":
            self.in_head = True
        elif tag == "title" and self.in_head:
            self.in_title = True
        elif tag == "link" and self.in_head:
            if attrs.get("rel") == "canonical":
                self.canonical = attrs.get("href", "")
            if attrs.get("rel") == "alternate" and attrs.get("hreflang"):
                self.alternates[attrs["hreflang"]] = attrs.get("href", "")
        elif tag == "meta" and self.in_head:
            key = attrs.get("property", attrs.get("name", ""))
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        elif tag == "form":
            self.form = attrs.get("method", "").lower() == "get"
        elif tag == "select" and self.form and attrs.get("name") == "lang":
            self.selector = True

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        elif tag == "title":
            self.in_title = False
        elif tag == "form":
            self.form = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def get(url):
    return subprocess.check_output(["curl", "--fail", "--silent", "--show-error", "--max-time", "30", url])


def check(origin, spec):
    path, locale, intent = spec
    query = {"lang": locale}
    if intent:
        query.update(intent=intent, utm_source="preview-check")
    doc = Document()
    doc.feed(get(f"{origin}{path}?{urlencode(query)}").decode())
    label = f"{path} {locale} {intent or ''}".strip()
    def require(condition, what):
        if not condition:
            raise ValueError(f"{label} failed {what}")
    require(doc.lang == locale and doc.selector, "HTML language or native language form")
    require(doc.title and doc.meta.get("og:title") == [doc.title], "document and OG title")
    require(doc.meta.get("description") and doc.meta.get("og:description") == doc.meta["description"], "description")
    require(doc.meta.get("og:locale") == [LOCALES[locale]], "OG locale")
    require(set(doc.meta.get("og:locale:alternate", [])) == set(LOCALES.values()) - {LOCALES[locale]}, "OG alternate locales")
    require(set(doc.alternates) == set(LOCALES) | {"x-default"}, "hreflang set")
    for language, href in doc.alternates.items():
        url = urlsplit(href)
        params = {"intent": ["agent" if intent == "delegation" else intent]} if intent else {}
        if language != "x-default":
            params["lang"] = [language]
        require(url.scheme in ("https", "http") and url.netloc and (url.path or "/") == path and parse_qs(url.query) == params, f"{language} URL")
    require(doc.canonical == doc.alternates[locale] and doc.meta.get("og:url") == [doc.canonical], "canonical and OG URL")
    images = doc.meta.get("og:image", [])
    require(len(images) == 1 and urlsplit(images[0]).netloc and images == doc.meta.get("twitter:image"), "share image")
    return path, locale, intent, doc.title, urlsplit(images[0]).path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("origin")
    origin = parser.parse_args().origin.rstrip("/")
    uri = urlsplit(origin)
    if uri.scheme not in {"https", "http"} or not uri.netloc or uri.path or uri.query or uri.fragment or uri.username or uri.password:
        parser.error("Provide a bare site origin.")
    specs = [(path, locale, None) for locale in LOCALES for path in PAGES]
    specs += [("/register", locale, intent) for locale in LOCALES for intent in INTENTS]
    with ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(lambda spec: check(origin, spec), specs))
    for locale in LOCALES:
        titles = {intent: title for _, lang, intent, title, _ in rows if lang == locale and intent}
        if len(set(titles.values())) != 5 or titles["delegation"] != titles["agent"]:
            raise ValueError(f"{locale} has incorrect per-intent titles")
    for image_path in {row[-1] for row in rows}:
        if not get(origin + image_path).startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError("Share image did not return a PNG")
    print(json.dumps({"origin": origin, "html_previews": len(rows), "locales": list(LOCALES), "result": "passed"}))


if __name__ == "__main__":
    main()
