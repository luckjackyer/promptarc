# Fast Launch Steps

Use this when you want the quickest path from repo to public site.

## 1. Set your launch values

Run:

```powershell
.\scripts\setup-site.ps1 -SiteName "Your Brand" -Domain "www.yourdomain.com" -ContactEmail "you@yourdomain.com" -GumroadUrl "https://yourbrand.gumroad.com/l/prompt-pack"
```

Optional:

- `-RootDomain "yourdomain.com"`
- `-NewsletterEndpoint "https://your-email-tool-endpoint"`
- `-ChatgptLink "https://your-affiliate-link"`
- `-ClaudeLink "https://your-affiliate-link"`
- `-PerplexityLink "https://your-affiliate-link"`
- `-NotionLink "https://your-affiliate-link"`

## 2. Publish

- Create a GitHub repository
- Push this folder
- Turn on GitHub Pages
- Copy `CNAME.example` to `CNAME` and replace it with your real domain
- Add the same domain inside GitHub Pages settings

## 3. Connect DNS in Cloudflare

- `www` as CNAME to `<your-github-username>.github.io`
- Apex domain as the 4 GitHub Pages A records if you want root domain support
- Keep proxy off during initial verification if needed

## 4. Finish launch checks

- Confirm homepage loads
- Confirm `/tool/` and `/library/` load
- Confirm HTTPS is active
- Submit the sitemap in Search Console
