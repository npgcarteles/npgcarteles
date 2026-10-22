<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Storefront simulations use the existing streaming AI edit endpoint with ordered inputs (customer facade, customer logo, NPG portfolio style references); the result is illustrative while purchased dimensions and server pricing remain unchanged.
- Orders are sent only through the internal order system (no WhatsApp/Instagram order sharing) so every request is persisted before confirmation.
- Order prices, statuses and payment amounts are computed and written only in server functions (`src/lib/orders.functions.ts`) with the admin client; clients only have SELECT RLS, so the browser can never set price or "approved".
- Payments use Mercado Pago Checkout Pro; a payment counts only after the server re-reads it from MP's API (webhook with signature check or return-page sync), keyed by `payments.id` as external_reference.
- Pure pricing/payment/status rules live in `src/lib/orders.shared.ts` with tests next to it.
- Fixed storefront quotes use the shared catalog, are validated and persisted server-side, and wait for NPG confirmation before payment; legacy quotes retain manual/automatic rules. Pickup metadata is stored in order config and request UUIDs have a per-user unique database index to make retries idempotent.
- Store catalog, installation notice and workshop pickup share presentation components in `src/components/store-catalog.tsx` so conditions remain consistent throughout purchase.
- The catalog selector is embedded in configuration and uses the shared catalog; portfolio images stay independent so selecting dimensions never implies an example photo's measured size.
- The order checkout presentation lives in `src/components/order-checkout.tsx` with scoped semantic tokens; it consumes server-confirmed amounts and calls the existing payment function, never the notification webhook, to avoid changing payment authority.
- Full AI edits do not attach planar-homography metadata to orders because their pixels are not calibrated; keep source photos in the local draft and invalidate previews on design changes to prevent stale simulations accompanying a new quote.
