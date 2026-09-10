# Wendao AI network gateway

The production H5 and native app use `https://wendao.wonderelian.com` as `VITE_COMPANION_API_URL`. `/api/` is forwarded by a dedicated Wendao HTTPS Nginx server to the existing Vercel project. Other sites retain their original shared server and static routing.

On 2026-09-10 the paired iPhone returned NSURLErrorDomain -1001 for the default `wendao-companion-api.vercel.app` health endpoint after 13 seconds, while the Wendao website returned HTTP 200 in 1.24 seconds. The Alibaba server also could not reach the default endpoint. Its system DNS returned 69.162.134.178 while public authoritative resolution returned 64.29.17.131 and 216.198.79.131. Pinning those addresses with the default SNI did not work either. This was not a model balance issue: an authenticated desktop web request returned a full answer.

The Vercel project now has the verified alias `wendao-api.wonderelian.com`, with an automatically renewed certificate. Its DNS A record is 216.198.79.1, selected from Vercel's recommended addresses after successful mainland-server HTTPS validation. The legacy 76.76.21.21 address was not reachable in this test.

`wendao-api-gateway.conf` uses Vercel's published stable IPv4 addresses and validates TLS against the custom alias, using the system CA bundle. It preserves bearer authentication and CORS, disables buffering/cache/compression for streaming, and limits upstream connection time. No secrets are included. Keep these upstream IPs aligned with Vercel's domain configuration if its recommended stable addresses change.

Before deploying this dedicated server, remove only `wendao.wonderelian.com` from the existing shared HTTPS server_name list; the HTTP redirect and other domains stay as before. Validate with `nginx -t` before reloading. The original shared configuration is backed up at `/srv/wonderelian/backups/nginx-before-wendao-api-20260910.conf`.

Client version 1.8 (21) also preserves the WebKit SSE transport fix from build 20 and distinguishes connecting from actual server generation. A slow connection must never say that AI is already composing. Old build-time references to the default Vercel endpoint are migrated to the owned gateway; explicit test endpoints remain unchanged.

Validation and phone readback evidence are kept in local `work/release-adaptive/`. Native diagnostics can be enabled only in Debug with launch environment `WENDAO_NETWORK_PROBE=1`; they request public health endpoints only. Actual generated answers must be verified separately from health checks.
