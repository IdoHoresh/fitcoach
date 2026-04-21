# Trust-store supplements for build-time scripts

This directory contains PEM certificates that Node's bundled Mozilla trust
store does not include, required by specific scraper/downloader scripts.

**Not used by the app.** These certs are only loaded during
`npm run download-*` / `npm run build-*` scripts via the
`NODE_EXTRA_CA_CERTS` env var.

## Files

### `sectigo-public-server-auth-ca-dv-r36.pem`

Intermediate certificate for `*.publishedprices.co.il` (Israeli Price
Transparency Law feed aggregator used by `npm run download-tivtaam-feed`).

The feed server only sends the leaf cert during the TLS handshake — no
intermediate — so Node's TLS can't chain up to the Sectigo root it
already trusts. Browsers + curl handle this via AIA-chasing; Node does
not. The intermediate shipped here is the standard public Sectigo DV R36
intermediate (public key infra, not sensitive).

- Issuer: `Sectigo Public Server Authentication Root R46`
- Validity: `2021-03-22 → 2036-03-21`
- Source: `http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt`
  (DER, converted to PEM via `openssl x509 -inform DER -out ...`)

If the cert expires or Sectigo rotates the intermediate, re-fetch from
the URL above, convert, and replace this file.
