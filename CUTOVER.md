# DNS cutover — boss action required

**Vercel project:** `toke-story` (NOT `mctoken-replica` / NOT `mctoken.xyz`)

**Production URL (live now):** https://toke-story.vercel.app

---

## Boss: one DNS change

In DNS for **mctoken.xyz** (registrar — do **not** move whole domain to Vercel nameservers unless intended):

1. **Delete** any `story` record pointing to Squarespace  
2. **Add:**

| Type | Name | Value |
|------|------|--------|
| **A** | `story` | `76.76.21.21` |

3. Wait 15–60 min → https://story.mctoken.xyz should match https://toke-story.vercel.app  
4. Squarespace → disconnect `story.mctoken.xyz`

---

## Done on your side

- [x] Separate repo folder & Vercel project `toke-story`
- [x] Production deploy → https://toke-story.vercel.app
- [x] Domain `story.mctoken.xyz` attached in Vercel (pending DNS)

## You verify after DNS

- Vercel → toke-story → Domains → **Valid**
- https://story.mctoken.xyz loads with padlock
