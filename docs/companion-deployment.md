# Wendao Companion deployment

`问道同行 / Wendao Companion` must remain disabled in production until every gate below passes. Reading, search, sharing, and the life manual remain free and do not depend on these services.

## Products and prices

| Provider | Monthly | Annual |
| --- | --- | --- |
| Product ID | `wendao_companion_monthly` | `wendao_companion_annual` |
| China price | `¥68` | `¥698` |
| USD base | `US$19.99` | `US$199.99` |
| Apple ID | `com.yonge6.wendao.companion.monthly` | `com.yonge6.wendao.companion.annual` |

- No free trial, introductory free period, or free AI messages.
- Active membership includes unlimited questions. Server concurrency and burst controls are abuse safeguards, not a monthly limit.
- Configure Stripe multi-currency prices with the exact CNY amounts and USD base. Other currencies use Stripe localization from USD.
- Configure both StoreKit products in one auto-renewable subscription group. Set the US storefront base prices above, set the China storefront prices explicitly, and let App Store storefront localization handle other regions.

## Supabase

1. Link the production project.
2. Apply migrations `202608190001` through `202608190006` in order.
3. Confirm RLS is forced on user-owned tables and only `service_role` can execute mutation and billing RPCs.
4. Configure Apple and Google OAuth plus the H5 and `com.yonge6.wendao://auth/callback` redirects.

## API environment

Copy the variable names from `.env.example` into the server deployment. Never place the service-role, model, Stripe, or webhook secrets in `VITE_*` variables.

Set the Stripe webhook URL to:

`https://YOUR_WENDAO_API_DOMAIN/api/billing/stripe-webhook`

Subscribe at minimum to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`

Set the App Store Server Notifications V2 production and sandbox URL to:

`https://YOUR_WENDAO_API_DOMAIN/api/billing/apple-notifications`

The API uses Apple's official server library, bundled public G2/G3 roots, bundle ID `com.yonge6.wendao`, and App Apple ID `6796945428` to verify notification and transaction JWS signatures.

## Release gates

1. `npm test`
2. `npx tsc --noEmit`
3. `npm audit --omit=dev --audit-level=high`
4. `npm run ios:build:simulator`
5. Stripe test-mode monthly purchase, annual purchase, renewal, payment failure, cancellation, full refund, portal, and duplicate-event replay.
6. StoreKit sandbox monthly purchase, annual purchase, pending purchase, cancel, restore, renewal, grace period, expiry, refund, and cross-device restore.
7. Prove a Stripe entitlement unlocks H5 and iOS without exposing a web purchase link inside iOS; prove an Apple entitlement unlocks both surfaces.
8. Verify memory pause/delete, account deletion, weekly reflection, immediate safety response, rate controls, and core free reading regression.
