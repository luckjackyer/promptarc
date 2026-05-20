# PromptArc Post-Launch Runbook

## Current Status

- Production URL: `http://www.promptarc.cc/`
- GitHub repo: `https://github.com/luckjackyer/promptarc`
- GitHub Pages custom domain: `www.promptarc.cc`
- Cloudflare DNS: `DNS only` for GitHub Pages records
- Deployment path: GitHub Contents API uploader in `scripts/deploy-node.mjs`

## Next Checks

- Wait for GitHub Pages HTTPS certificate to finish issuing.
- Enable `Enforce HTTPS` in GitHub Pages after the certificate is ready.
- Keep Cloudflare DNS records gray cloud / DNS only until GitHub Pages HTTPS is stable.
- Submit `https://www.promptarc.cc/sitemap.xml` in Google Search Console after HTTPS is active.

## Search Setup

- Create a Google Search Console domain property for `promptarc.cc`.
- Verify the property using a DNS TXT record in Cloudflare.
- Submit the sitemap.
- Request indexing for:
  - `https://www.promptarc.cc/`
  - `https://www.promptarc.cc/tool/`
  - `https://www.promptarc.cc/library/`
  - The 12 template landing pages under `/library/`

## Analytics Setup

- Add Cloudflare Web Analytics first because it is lightweight.
- Paste the Cloudflare Web Analytics token into `cloudflareAnalyticsToken` in `config.js`.
- Add GA4 later if you need channel attribution and conversion events.
- Track these early events manually at first:
  - prompt generated
  - free pack downloaded
  - recommended tool clicked
  - template page visited

## Monetization Setup

- Replace default recommended tool URLs after affiliate approval.
- Create a Gumroad PromptArc Starter Pack.
- Set `GUMROAD_URL` in `.env` and `config.js`.
- Add the contact email before public outreach.

## Weekly Operating Rhythm

- Publish 5 new template pages each week.
- Check Search Console queries every Friday.
- Improve pages with impressions but weak CTR.
- Add internal links from library hub to pages getting impressions.
- Keep one clear CTA on every template page.
