# Toke Story (standalone)

Long-form story site for **story.mctoken.xyz** only.

**Not** the main site (`mctoken.xyz`) — that lives in `../mctoken-replica` as a separate Vercel project.

| | Toke Story | Main site |
|---|------------|-----------|
| Folder | `toke-story/` | `mctoken-replica/` |
| Vercel project | `toke-story` | (mctoken-replica project) |
| Domain | `story.mctoken.xyz` | `mctoken.xyz` |

```bash
npm run dev      # http://127.0.0.1:4321
npm run assets   # refresh from Squarespace HTML
npx vercel deploy --prod --yes
```

See [CUTOVER.md](./CUTOVER.md) for DNS handoff to your boss.
