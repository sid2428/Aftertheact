# Extended SEO, Analytics & Pre‑Launch Plan for Aftertheact

## Goal Description
Add lightweight SEO for brand keywords, integrate user metrics & analytics, and outline final pre‑launch checks for the community voting platform. All changes remain invisible to users and keep operating costs low.

## User Review Required
> [!IMPORTANT]
> The plan now includes analytics scripts and additional launch check‑list items. Review the script placement, privacy considerations, and any hosting constraints before merging.

## Open Questions
> [!WARNING]
> - **Analytics Provider Preference**: Do you prefer a free solution (Google Analytics GA4, Plausible, Matomo Cloud) or a self‑hosted option? This affects where the script is added and any server‑side configuration.
> - **Cookie Consent**: Will you need a consent banner for analytics (GDPR/CCPA) or rely on implied consent?
> - **Hosting Setup**: Are you deploying to a static host (Vercel/Netlify) or a traditional server? Some header configurations differ.

---
## Proposed Changes

### 1. SEO – unchanged (retain lightweight meta tags & sitemap from previous plan)
*(see earlier sections for title, description, JSON‑LD, sitemap, robots.txt)*

---
### 2. User Metrics & Analytics (Low‑Cost Options)
#### a. Google Analytics 4 (GA4) – Free
Add the GA4 gtag script just before the closing `</head>` tag. It loads asynchronously and does not block rendering.
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { 'anonymize_ip': true });
</script>
```
Replace `G-XXXXXXXXXX` with your GA4 Measurement ID.

#### b. Alternative lightweight open‑source option – Plausible (free tier) or Matomo Cloud
If you prefer privacy‑first analytics, embed their script similarly:
```html
<script async data-domain="aftertheact.com" src="https://plausible.io/js/plausible.js"></script>
```
Adjust the domain accordingly.

#### c. Basic Event Tracking for Community Votes
Add a small inline script (or use the analytics provider’s event API) to fire an event whenever a vote button is clicked.
```html
<script>
  document.addEventListener('click', function(e) {
    if (e.target.matches('.vote-button')) {
      gtag('event', 'vote', {
        'event_category': 'Community',
        'event_label': e.target.dataset.itemId || 'unknown'
      });
    }
  });
</script>
```
Adapt selector `.vote-button` to your actual markup.

---
### 3. Google Search Console – Add Tagline & Verification
Include the official description as a comment for future reference and the verification meta tag.
```html
<!-- Search Console tools and reports help you measure your site's Search traffic and performance, fix issues, and make your site shine in Google Search results -->
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```
Replace `YOUR_VERIFICATION_CODE` with the token you receive from GSC.

---
### 4. Additional Pre‑Launch Checklist
| Category | Item | Reason |
|----------|------|--------|
| **Performance** | Enable gzip/brotli compression (server config) | Faster load times, better Core Web Vitals |
| | Set `Cache‑Control` headers for static assets | Reduce bandwidth, lower cost |
| **Security** | Add HTTP security headers (`Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `Referrer-Policy`, `Strict‑Transport‑Security`) | Protect against XSS, MIME sniffing, and man‑in‑the‑middle |
| **Privacy/Legal** | Publish Privacy Policy & Terms of Service | Required for analytics and community platforms |
| | Implement cookie consent banner if analytics use non‑essential cookies | GDPR/CCPA compliance |
| **Accessibility** | Ensure `lang` attribute on `<html>` (e.g., `lang="en"`) | Improves SEO & accessibility |
| | Verify heading hierarchy and ARIA labels for voting widgets | Better assistive‑technology support |
| **Testing** | Run Lighthouse CI (audit for SEO, Performance, Accessibility) | Catch regressions before launch |
| | Perform unit & integration tests for vote‑handling logic | Prevent broken voting flow |
| **Deployment** | Configure DNS & HTTPS (let's encrypt or provider cert) | Secure connections, trust signal |
| | Set up CI/CD pipeline to run `npm run build && npm test` on each push | Automated quality gate |

---
## Verification Plan
### Automated
- `npm run build` – ensure the site compiles with the added script tags.
- `curl -s https://www.aftertheact.com/ | grep -i "gtag"` – confirm analytics script is present.
- `curl -I https://www.aftertheact.com/robots.txt` – check `Sitemap` line.
- Run Lighthouse CI (`npm run lighthouse`) and verify SEO & Performance scores improve.
- Run unit tests for vote button events (`npm test`).

### Manual
- Use Google Search Console **URL Inspection** to confirm meta tags, structured data, and verification.
- Open the live site, open DevTools → Network, filter for `collect` requests to verify GA4 (or Plausible) is sending data.
- Perform a quick Google search for **"Aftertheact"** and **"India's got latent"** after a few hours to see the site appear.
- Review privacy policy page and test the consent banner if implemented.

---
**End of Extended Plan**
