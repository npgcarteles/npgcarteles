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
- Order prices, statuses and payment amounts are computed and written only in server functions (`src/lib/orders.functions.ts`) with the admin client; clients only have SELECT RLS, so the browser can never set price or "approved".
- Payments use Mercado Pago Checkout Pro; a payment counts only after the server re-reads it from MP's API (webhook with signature check or return-page sync), keyed by `payments.id` as external_reference.
- Pure pricing/payment/status rules live in `src/lib/orders.shared.ts` with tests next to it.
- The order checkout presentation lives in `src/components/order-checkout.tsx` with scoped semantic tokens; it consumes server-confirmed amounts and calls the existing payment function, never the notification webhook, to avoid changing payment authority.
