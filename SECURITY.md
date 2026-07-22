# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub's private vulnerability reporting for this repository. Do not include authentication tokens, cookies, raw visitor IP addresses, or other sensitive request data in an issue.

The deployed demo also publishes `/.well-known/security.txt` with its canonical policy location.

## Scope

The demo login verifies Cloudflare Turnstile only. It intentionally provides no authentication session and stores no user credentials. Public API responses contain synthetic demonstration data.
