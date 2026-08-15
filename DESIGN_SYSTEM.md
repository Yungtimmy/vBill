# VerseBill design system

Paste this into a new chat to reload taste.

VerseBill is Coinbase Business cleanliness crossed with Request Finance verification. Off-white paper, dark type, one green accent. Recurring mark: the On-chain Proof card. No neon, no glass, no three-column feature grids, no token logos as decoration.

## Tokens

| Slot | Value | Role |
| --- | --- | --- |
| bg | `#F6F5F2` | Page |
| surface | `#FFFFFF` | Cards |
| line | `#E6E4DE` | Hairlines |
| ink | `#161616` | Type |
| mute | `#6B6B6B` | Secondary |
| accent | `#0C7A4D` | VERSE / paid / verified |
| wait | `#C4841D` | Pending |
| bad | `#C23B3B` | Failed / overdue |

Type: Space Grotesk for UI. Syne only on the wordmark. Buttons shrink (`scale-95`). No exclamation marks. No emoji except the check used as a status mark.

## Screens

Merchant: Overview, Invoices, Payments, Clients, Settings, Invoice detail (centerpiece).
Customer: `/pay/[id]` request → confirm → sent. `/verify/[id]` receipt.

## Recurring component

`OnChainProof`: Polygon, VERSE contract, merchant wallet, exact amount, confirmation, explorer link.
