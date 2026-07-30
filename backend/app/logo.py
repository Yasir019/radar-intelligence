from urllib.parse import quote, urlparse


_PLACEHOLDER_DOMAINS = ("example.com", "example.org", "example.net")


def company_logo_url(website: str | None) -> str | None:
    """Return the company's favicon URL, allowing the UI to fall back on failure."""
    if not website:
        return None

    candidate = website.strip()
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if not hostname:
        return None

    # Demo/placeholder hosts have no real brand identity. Returning no image
    # keeps the original initials badge instead of showing a generic globe.
    if (
        hostname == "localhost"
        or hostname.endswith(".invalid")
        or any(hostname == domain or hostname.endswith(f".{domain}") for domain in _PLACEHOLDER_DOMAINS)
    ):
        return None

    # Real companies often declare their icon somewhere other than
    # /favicon.ico. Google's favicon endpoint discovers those declarations and
    # returns a consistently sized image for the dashboard.
    return f"https://www.google.com/s2/favicons?domain={quote(hostname)}&sz=128"
