const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);

["site.config.js", "categories.js", "posts.js", "columns.js"].forEach((file) => {
  const code = fs.readFileSync(path.join(root, "data", file), "utf8");
  vm.runInContext(code, context, { filename: file });
});

const site = context.window.SITE_CONFIG;
const categories = context.window.CATEGORIES;
const posts = context.window.POSTS;
const columns = context.window.COLUMNS;

function cleanBase(url) {
  return String(url).replace(/\/$/, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function writeFile(relativePath, content) {
  const target = path.join(root, relativePath);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content);
}

function shell({ title, description, canonical, type = "website" }) {
  const verification = site.googleSiteVerification
    ? `<meta name="google-site-verification" content="${escapeHtml(site.googleSiteVerification)}">`
    : "";
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(cleanBase(site.baseUrl))}/assets/icons/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${verification}
  <link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.siteName)} RSS" href="/feed.xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <div id="app"></div>
  <noscript>이 사이트는 기본 탐색과 CMS-lite 화면 렌더링을 위해 JavaScript를 사용합니다.</noscript>
  <script src="/data/site.config.js"></script>
  <script src="/data/categories.js"></script>
  <script src="/data/posts.js"></script>
  <script src="/data/columns.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
`;
}

const base = cleanBase(site.baseUrl);
const routes = [
  {
    path: "index.html",
    url: "/",
    title: `${site.siteName} - ${site.tagline}`,
    description: `${site.topic}를 초보자도 이해하기 쉽게 정리하는 한국어 정보 사이트입니다.`
  },
  { path: "about/index.html", url: "/about/", title: `사이트 소개 - ${site.siteName}`, description: `${site.siteName}의 운영 목적, 주제, 편집 원칙을 안내합니다.` },
  { path: "author/index.html", url: "/author/", title: `${site.authorName} 운영자 소개 - ${site.siteName}`, description: `${site.authorName} 운영자의 소개, 편집 원칙, 칼럼 목록과 최신 글을 확인하세요.` },
  { path: "contact/index.html", url: "/contact/", title: `문의하기 - ${site.siteName}`, description: `${site.siteName}에 이메일 기반으로 문의하고 콘텐츠 제안을 보낼 수 있습니다.` },
  { path: "categories/index.html", url: "/categories/", title: `카테고리 - ${site.siteName}`, description: `ChatGPT 활용법, AI 업무 자동화, AI 개발 도구 등 주제별 글을 모았습니다.` },
  { path: "columns/index.html", url: "/columns/", title: `운영자 칼럼 - ${site.siteName}`, description: `${site.authorName} 운영자가 AI 활용 흐름과 편집 메모를 정리한 칼럼입니다.` },
  { path: "admin/index.html", url: "/admin/", title: `CMS-lite 관리자 - ${site.siteName}`, description: `정적 사이트용 CMS-lite 데모 관리자 화면입니다. 실제 보안 관리자 시스템이 아닙니다.` },
  { path: "privacy/index.html", url: "/privacy/", title: `개인정보처리방침 - ${site.siteName}`, description: `${site.siteName}의 개인정보 처리 기준과 이메일 문의 정보 취급 방침을 안내합니다.` },
  { path: "terms/index.html", url: "/terms/", title: `이용약관 - ${site.siteName}`, description: `${site.siteName} 콘텐츠 이용과 서비스 운영에 관한 기본 약관입니다.` },
  { path: "disclaimer/index.html", url: "/disclaimer/", title: `면책고지 - ${site.siteName}`, description: `${site.siteName} 콘텐츠의 정보 제공 목적과 사용상 주의사항을 안내합니다.` },
  { path: "sitemap/index.html", url: "/sitemap/", title: `사이트맵 - ${site.siteName}`, description: `${site.siteName}의 주요 페이지, 카테고리, 글, 칼럼 링크를 모았습니다.` },
  { path: "404.html", url: "/404.html", title: `페이지를 찾을 수 없습니다 - ${site.siteName}`, description: `요청한 페이지를 찾을 수 없습니다. 홈이나 사이트맵으로 이동해 주세요.` }
];

categories.forEach((category) => {
  routes.push({
    path: `categories/${category.slug}/index.html`,
    url: `/categories/${category.slug}/`,
    title: `${category.name} - ${site.siteName}`,
    description: category.description
  });
});

posts.forEach((post) => {
  routes.push({
    path: `posts/${post.slug}/index.html`,
    url: `/posts/${post.slug}/`,
    title: `${post.title} - ${site.siteName}`,
    description: post.summary,
    type: "article",
    updatedAt: post.updatedAt
  });
});

columns.forEach((column) => {
  routes.push({
    path: `columns/${column.slug}/index.html`,
    url: `/columns/${column.slug}/`,
    title: `${column.title} - ${site.siteName}`,
    description: column.summary,
    type: "article",
    updatedAt: column.updatedAt
  });
});

routes.forEach((route) => {
  writeFile(
    route.path,
    shell({
      title: route.title,
      description: route.description,
      canonical: `${base}${route.url}`,
      type: route.type || "website"
    })
  );
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .filter((route) => route.url !== "/404.html" && route.url !== "/admin/")
  .map(
    (route) => `  <url>
    <loc>${base}${route.url}</loc>
    <lastmod>${route.updatedAt || "2026-06-21"}</lastmod>
    <changefreq>${route.url === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${route.url === "/" ? "1.0" : route.url.includes("/posts/") || route.url.includes("/columns/") ? "0.8" : "0.7"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFile("sitemap.xml", sitemap);

writeFile(
  "robots.txt",
  `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${base}/sitemap.xml
`
);

const rssItems = [...posts, ...columns]
  .sort((a, b) => new Date(b.updatedAt || b.publishedAt) - new Date(a.updatedAt || a.publishedAt))
  .slice(0, 20)
  .map((item) => {
    const isColumn = columns.includes(item);
    const link = `${base}/${isColumn ? "columns" : "posts"}/${item.slug}/`;
    return `  <item>
    <title>${escapeHtml(item.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    <description>${escapeHtml(item.summary)}</description>
    <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
  </item>`;
  })
  .join("\n");

writeFile(
  "feed.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeHtml(site.siteName)}</title>
  <link>${base}/</link>
  <description>${escapeHtml(site.tagline)}</description>
  <language>ko</language>
${rssItems}
</channel>
</rss>
`
);

writeFile(
  "assets/icons/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="AI 활용 연구소">
  <rect width="64" height="64" rx="14" fill="${site.mainColor}"/>
  <path d="M18 44L29 18h6l11 26h-7l-2-6H27l-2 6h-7zm11-12h6l-3-8-3 8z" fill="white"/>
</svg>
`
);

writeFile(
  "assets/icons/og-image.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeHtml(site.siteName)} 미리보기">
  <rect width="1200" height="630" fill="#F8FAFC"/>
  <rect x="70" y="70" width="1060" height="490" rx="16" fill="#ffffff" stroke="#BFDBFE"/>
  <rect x="110" y="110" width="76" height="76" rx="16" fill="${site.mainColor}"/>
  <text x="148" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">AI</text>
  <text x="110" y="245" font-family="Arial, sans-serif" font-size="62" font-weight="800" fill="#111827">${escapeHtml(site.siteName)}</text>
  <text x="110" y="315" font-family="Arial, sans-serif" font-size="30" fill="#334155">${escapeHtml(site.tagline)}</text>
  <text x="110" y="390" font-family="Arial, sans-serif" font-size="24" fill="#2563EB">ChatGPT · 업무 자동화 · 개발 도구 · 생산성</text>
</svg>
`
);

console.log(`Generated ${routes.length} pages, sitemap.xml, feed.xml, robots.txt`);
