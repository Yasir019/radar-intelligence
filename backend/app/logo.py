from urllib.parse import urlparse


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

    # Use the site's real icon rather than a logo service that may return a
    # generic globe for unknown domains. A missing icon produces an image error,
    # and CompanyLogo then keeps the original initials badge.
    scheme = parsed.scheme if parsed.scheme in {"http", "https"} else "https"
    return f"{scheme}://{hostname}/favicon.ico"
