from urllib.parse import quote, urlparse


def company_logo_url(website: str | None) -> str | None:
    """Return a stable, high-resolution favicon URL for a company website."""
    if not website:
        return None

    candidate = website.strip()
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    hostname = (urlparse(candidate).hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if not hostname:
        return None

    return f"https://www.google.com/s2/favicons?domain={quote(hostname)}&sz=128"
