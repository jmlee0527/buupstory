(function () {
  const config = window.SITE_CONFIG;
  const defaultContent = {
    site: config,
    categories: window.CATEGORIES,
    posts: window.POSTS,
    columns: window.COLUMNS
  };
  const storeKey = "aiLabCmsData";
  const sessionKey = "aiLabAdminSession";
  const root = document.getElementById("app");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getContent() {
    const stored = localStorage.getItem(storeKey);
    if (!stored) return clone(defaultContent);
    try {
      const parsed = JSON.parse(stored);
      return {
        site: { ...clone(defaultContent.site), ...(parsed.site || {}) },
        categories: parsed.categories || clone(defaultContent.categories),
        posts: parsed.posts || clone(defaultContent.posts),
        columns: parsed.columns || clone(defaultContent.columns)
      };
    } catch (error) {
      return clone(defaultContent);
    }
  }

  function saveContent(content) {
    localStorage.setItem(storeKey, JSON.stringify(content));
  }

  function isAdmin() {
    return localStorage.getItem(sessionKey) === "true";
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(value));
  }

  function sortRecent(items) {
    return [...items].sort((a, b) => new Date(b.updatedAt || b.publishedAt) - new Date(a.updatedAt || a.publishedAt));
  }

  function categoryBySlug(content, slug) {
    return content.categories.find((item) => item.slug === slug);
  }

  function postBySlug(content, slug) {
    return content.posts.find((item) => item.slug === slug);
  }

  function columnBySlug(content, slug) {
    return content.columns.find((item) => item.slug === slug);
  }

  function authorLink(content) {
    return `<a class="text-link" href="/author/">${escapeHtml(content.site.authorName)}</a>`;
  }

  function layout(content, pageHtml) {
    const navLinks = [
      ["/categories/", "카테고리"],
      ["/columns/", "운영자 칼럼"],
      ["/about/", "소개"],
      ["/contact/", "문의"]
    ];
    document.documentElement.style.setProperty("--primary", content.site.mainColor || config.mainColor);
    document.documentElement.style.setProperty("--surface", content.site.subColor || config.subColor);
    root.innerHTML = `
      <a class="skip-link" href="#main">본문으로 건너뛰기</a>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="/" aria-label="${escapeHtml(content.site.siteName)} 홈">
            <span class="brand-mark">AI</span>
            <span>${escapeHtml(content.site.siteName)}</span>
          </a>
          <button class="menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <nav class="nav" aria-label="주요 메뉴">
            ${navLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
          </nav>
        </div>
      </header>
      <main id="main">${pageHtml}</main>
      ${footer(content)}
    `;
    const toggle = root.querySelector(".menu-toggle");
    const nav = root.querySelector(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
      });
    }
  }

  function footer(content) {
    return `
      <footer class="footer">
        <div class="container footer-grid">
          <section>
            <h2>${escapeHtml(content.site.siteName)}</h2>
            <p>${escapeHtml(content.site.tagline)}</p>
            <p>운영자 ${authorLink(content)} · 문의 ${escapeHtml(content.site.email)}</p>
          </section>
          <section>
            <h3>사이트</h3>
            <a href="/about/">소개</a>
            <a href="/author/">운영자 소개</a>
            <a href="/sitemap/">사이트맵</a>
          </section>
          <section>
            <h3>콘텐츠</h3>
            <a href="/categories/">카테고리</a>
            <a href="/columns/">운영자 칼럼</a>
            <a href="/contact/">문의하기</a>
          </section>
          <section>
            <h3>정책</h3>
            <a href="/privacy/">개인정보처리방침</a>
            <a href="/terms/">이용약관</a>
            <a href="/disclaimer/">면책고지</a>
          </section>
        </div>
        <div class="container" style="margin-top:24px;color:#94a3b8;font-size:14px;">
          © ${escapeHtml(content.site.copyrightYear)} ${escapeHtml(content.site.siteName)}. 모든 콘텐츠는 정보 제공을 목적으로 합니다.
        </div>
      </footer>
    `;
  }

  function breadcrumbs(items) {
    return `
      <nav class="breadcrumb" aria-label="브레드크럼">
        ${items
          .map((item, index) =>
            index === items.length - 1
              ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
              : `<a href="${item.href}">${escapeHtml(item.label)}</a><span>/</span>`
          )
          .join("")}
      </nav>
    `;
  }

  function addJsonLd(data) {
    document.querySelectorAll("script[data-dynamic-jsonld]").forEach((node) => node.remove());
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.dynamicJsonld = "true";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function postCard(content, post) {
    const category = categoryBySlug(content, post.category);
    return `
      <a class="card post-card" href="/posts/${post.slug}/">
        <span class="badge">${escapeHtml(category ? category.name : "일반 글")}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p class="summary">${escapeHtml(post.summary)}</p>
        <div class="card-footer meta">
          <span>${escapeHtml(post.author)}</span>
          <span>수정 ${formatDate(post.updatedAt)}</span>
          <span>${post.readingMinutes || 5}분 읽기</span>
        </div>
      </a>
    `;
  }

  function columnCard(content, column) {
    return `
      <a class="card post-card" href="/columns/${column.slug}/">
        <span class="badge">운영자 칼럼</span>
        <h3>${escapeHtml(column.title)}</h3>
        <p class="summary">${escapeHtml(column.summary)}</p>
        <div class="card-footer meta">
          <span>${escapeHtml(column.author)}</span>
          <span>수정 ${formatDate(column.updatedAt)}</span>
          <span>${column.readingMinutes || 4}분 읽기</span>
        </div>
      </a>
    `;
  }

  function renderHome(content) {
    const publishedPosts = content.posts.filter((post) => post.status !== "draft");
    const latest = sortRecent(publishedPosts).slice(0, 6);
    const featured = publishedPosts.filter((post) => post.featured).slice(0, 3);
    const latestColumns = sortRecent(content.columns.filter((column) => column.status !== "draft")).slice(0, 3);
    layout(
      content,
      `
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <span class="eyebrow">AI 업무 활용 정보 사이트</span>
            <h1>${escapeHtml(content.site.siteName)}</h1>
            <p class="lead">${escapeHtml(content.site.tagline)} ${escapeHtml(content.site.topic)}를 초보자도 따라가기 쉽게 정리합니다.</p>
            <div class="hero-actions">
              <a class="btn" href="/categories/">카테고리 둘러보기</a>
              <a class="btn secondary" href="/columns/">운영자 칼럼 보기</a>
            </div>
          </div>
          <aside class="visual-panel" aria-label="사이트 핵심 주제">
            <div class="visual-row"><span class="visual-icon">Q</span><div><strong>질문 설계</strong><p>목적과 맥락이 있는 AI 질문법</p></div></div>
            <div class="visual-row"><span class="visual-icon">A</span><div><strong>업무 자동화</strong><p>반복 작업을 줄이는 작은 워크플로우</p></div></div>
            <div class="visual-row"><span class="visual-icon">R</span><div><strong>검토 기준</strong><p>과장 없이 확인 가능한 정보 중심</p></div></div>
          </aside>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head">
            <div><h2>대표 카테고리</h2><p>입문자가 자주 마주치는 상황을 기준으로 주제를 나누었습니다.</p></div>
            <a class="text-link" href="/categories/">전체 보기</a>
          </div>
          <div class="grid cols-3">
            ${content.categories
              .map(
                (category) => `
                <a class="card" href="/categories/${category.slug}/">
                  <span class="category-icon">${escapeHtml(category.name.slice(0, 1))}</span>
                  <h3>${escapeHtml(category.name)}</h3>
                  <p class="summary">${escapeHtml(category.description)}</p>
                </a>`
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="section alt">
        <div class="container">
          <div class="section-head">
            <div><h2>최근 업데이트 글</h2><p>수정일 기준으로 최근 보완된 글을 먼저 보여줍니다.</p></div>
          </div>
          <div class="grid cols-3">${latest.map((post) => postCard(content, post)).join("")}</div>
        </div>
      </section>

      <section class="section">
        <div class="container grid cols-2">
          <div>
            <div class="section-head"><div><h2>추천 글</h2><p>처음 방문한 독자가 먼저 읽기 좋은 기준 글입니다.</p></div></div>
            <div class="grid">${featured.map((post) => postCard(content, post)).join("")}</div>
          </div>
          <aside>
            <div class="card">
              <h2>운영 목적</h2>
              <p>${escapeHtml(content.site.authorBio)}</p>
              <p>이 사이트는 AI를 과장 없이 업무와 일상에 적용하기 위한 기준, 예시, 주의사항을 정리합니다.</p>
            </div>
            <div class="card" style="margin-top:18px;">
              <h2>편집 원칙</h2>
              <ul>${content.site.editorialPrinciples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div class="author-box">
              <span class="avatar">이</span>
              <div>
                <h3>운영자 ${authorLink(content)}</h3>
                <p>${escapeHtml(content.site.authorBio)}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section alt">
        <div class="container">
          <div class="section-head">
            <div><h2>운영자 칼럼</h2><p>최근 입문자들이 자주 헷갈리는 지점과 운영 메모를 정리합니다.</p></div>
            <a class="text-link" href="/columns/">칼럼 목록</a>
          </div>
          <div class="grid cols-3">${latestColumns.map((column) => columnCard(content, column)).join("")}</div>
        </div>
      </section>

      <section class="section">
        <div class="container card">
          <h2>궁금한 주제가 있나요?</h2>
          <p>AI 활용법, 업무 자동화, 개발 도구 관련 문의와 제안은 이메일 기반으로 받고 있습니다.</p>
          <div class="button-row"><a class="btn" href="/contact/">문의하기</a><a class="btn secondary" href="mailto:${escapeHtml(content.site.email)}">${escapeHtml(content.site.email)}</a></div>
        </div>
      </section>`
    );
  }

  function renderCategoryIndex(content) {
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { label: "카테고리" }])}<h1>카테고리</h1><p class="lead">AI 활용 연구소의 주제별 글을 한눈에 볼 수 있습니다.</p></div></section>
      <section class="section"><div class="container grid cols-2">
        ${content.categories
          .map((category) => {
            const count = content.posts.filter((post) => post.category === category.slug && post.status !== "draft").length;
            return `<a class="card" href="/categories/${category.slug}/"><span class="badge">${count}개 글</span><h2>${escapeHtml(category.name)}</h2><p>${escapeHtml(category.description)}</p></a>`;
          })
          .join("")}
      </div></section>`
    );
  }

  function renderCategory(content, slug) {
    const category = categoryBySlug(content, slug);
    if (!category) return renderNotFound(content);
    const posts = sortRecent(content.posts.filter((post) => post.category === slug && post.status !== "draft"));
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { href: "/categories/", label: "카테고리" }, { label: category.name }])}<h1>${escapeHtml(category.name)}</h1><p class="lead">${escapeHtml(category.description)}</p></div></section>
      <section class="section"><div class="container grid cols-3">${posts.map((post) => postCard(content, post)).join("")}</div></section>`
    );
  }

  function renderPost(content, slug) {
    const post = postBySlug(content, slug);
    if (!post || post.status === "draft") return renderNotFound(content);
    const category = categoryBySlug(content, post.category);
    const sectionLinks = post.sections.map((section, index) => ({ id: `section-${index + 1}`, heading: section.heading }));
    const related = (post.relatedSlugs || []).map((item) => postBySlug(content, item)).filter(Boolean);
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { href: "/categories/", label: "카테고리" }, { href: `/categories/${category.slug}/`, label: category.name }, { label: post.title }])}<span class="badge">${escapeHtml(category.name)}</span><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.subtitle)}</p><div class="meta"><span>작성자 ${authorLink(content)}</span><span>발행 ${formatDate(post.publishedAt)}</span><span>수정 ${formatDate(post.updatedAt)}</span><span>${post.readingMinutes || 5}분 읽기</span></div></div></section>
      <section class="section"><div class="container content-layout">
        <article class="article">
          <div class="info-box"><strong>핵심 요약</strong><ul>${post.keyPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          <div class="article-body">
            ${post.sections
              .map(
                (section, index) => `
                <section id="section-${index + 1}">
                  <h2>${escapeHtml(section.heading)}</h2>
                  ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                </section>`
              )
              .join("")}
          </div>
          <div class="warn-box"><strong>초보자가 자주 실수하는 포인트</strong><ul>${post.mistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          <div class="info-box"><strong>체크리스트</strong><ul>${post.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          ${renderFaq(post.faq)}
          <p class="notice">이 글은 초보자 기준으로 이해하기 쉽게 정리되었으며, 내용은 운영 과정에서 순차적으로 보완될 수 있습니다.</p>
          ${editorBox(content)}
          <section class="section" style="padding-bottom:0;"><h2>관련 글</h2><div class="grid cols-2">${related.map((item) => postCard(content, item)).join("")}</div></section>
        </article>
        <aside class="toc card"><h2>목차</h2><ul>${sectionLinks.map((item) => `<li><a href="#${item.id}">${escapeHtml(item.heading)}</a></li>`).join("")}</ul></aside>
      </div></section>`
    );
    addJsonLd([articleJsonLd(content, post, category), breadcrumbJsonLd(content, ["홈", "카테고리", category.name, post.title]), faqJsonLd(post.faq)]);
  }

  function renderFaq(faq = []) {
    if (!faq.length) return "";
    return `<section class="article-body"><h2>자주 묻는 질문</h2>${faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join("")}</section>`;
  }

  function editorBox(content) {
    return `
      <div class="author-box">
        <span class="avatar">이</span>
        <div>
          <h3>편집자 ${authorLink(content)}</h3>
          <p>${escapeHtml(content.site.authorBio)}</p>
          <a class="text-link" href="/author/">운영자 소개와 칼럼 보기</a>
        </div>
      </div>
    `;
  }

  function articleJsonLd(content, post, category) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.summary,
      author: { "@type": "Person", name: content.site.authorName },
      publisher: { "@type": "Organization", name: content.site.siteName },
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      articleSection: category.name,
      mainEntityOfPage: `${content.site.baseUrl}/posts/${post.slug}/`
    };
  }

  function breadcrumbJsonLd(content, labels) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: labels.map((label, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: label
      }))
    };
  }

  function faqJsonLd(faq = []) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    };
  }

  function renderColumns(content) {
    const columns = sortRecent(content.columns.filter((column) => column.status !== "draft"));
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { label: "운영자 칼럼" }])}<h1>운영자 칼럼</h1><p class="lead">운영자 ${authorLink(content)}이 AI 활용 흐름에서 자주 보이는 질문과 관찰을 정리합니다.</p></div></section>
      <section class="section"><div class="container grid cols-3">${columns.map((column) => columnCard(content, column)).join("")}</div></section>`
    );
  }

  function renderColumn(content, slug) {
    const column = columnBySlug(content, slug);
    if (!column || column.status === "draft") return renderNotFound(content);
    const related = (column.relatedSlugs || []).map((item) => postBySlug(content, item)).filter(Boolean);
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { href: "/columns/", label: "운영자 칼럼" }, { label: column.title }])}<span class="badge">운영자 칼럼</span><h1>${escapeHtml(column.title)}</h1><p class="lead">${escapeHtml(column.subtitle)}</p><div class="meta"><span>작성자 ${authorLink(content)}</span><span>발행 ${formatDate(column.publishedAt)}</span><span>수정 ${formatDate(column.updatedAt)}</span></div></div></section>
      <section class="section"><div class="container content-layout">
        <article class="article article-body">
          ${column.body.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`).join("")}
          ${editorBox(content)}
          <section class="section" style="padding-bottom:0;"><h2>함께 읽기</h2><div class="grid cols-2">${related.map((item) => postCard(content, item)).join("")}</div></section>
        </article>
        <aside class="card"><h2>칼럼 안내</h2><p>칼럼은 일반 정보형 글과 달리 운영자의 관찰과 편집 방향을 담은 메모입니다.</p></aside>
      </div></section>`
    );
  }

  function renderAuthor(content) {
    const adminCta = isAdmin()
      ? `<a class="btn" href="/admin/#columns-new">새 칼럼 작성하기</a>`
      : `<p class="notice">운영자가 정리한 칼럼을 읽어보세요. 관리자 세션이 활성화되면 이 영역에 칼럼 작성 버튼이 표시됩니다.</p>`;
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { label: "운영자 소개" }])}<h1>${escapeHtml(content.site.authorName)}</h1><p class="lead">${escapeHtml(content.site.authorBio)}</p><div class="button-row">${adminCta}</div></div></section>
      <section class="section"><div class="container grid cols-2">
        <article class="card">
          <h2>운영 목적</h2>
          <p>${escapeHtml(content.site.siteName)}는 AI 활용을 처음 시작하는 사람이 도구 선택보다 활용 기준을 먼저 이해할 수 있도록 돕는 정보 사이트입니다.</p>
          <p>주제는 ${escapeHtml(content.site.topic)}이며, 독자가 업무와 일상에서 바로 검토할 수 있는 흐름을 중심으로 정리합니다.</p>
        </article>
        <article class="card">
          <h2>편집 원칙</h2>
          <ul>${content.site.editorialPrinciples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </article>
      </div></section>
      <section class="section alt"><div class="container"><div class="section-head"><div><h2>칼럼 목록</h2><p>운영자의 관찰과 편집 메모를 모았습니다.</p></div></div><div class="grid cols-3">${sortRecent(content.columns).map((column) => columnCard(content, column)).join("")}</div></div></section>
      <section class="section"><div class="container"><div class="section-head"><div><h2>최근 운영자 글</h2><p>수정일 기준 최근 글입니다.</p></div></div><div class="grid cols-3">${sortRecent(content.posts).slice(0, 6).map((post) => postCard(content, post)).join("")}</div></div></section>`
    );
  }

  function renderStaticPage(content, type) {
    const pages = {
      about: {
        title: "사이트 소개",
        body: `<p>${escapeHtml(content.site.siteName)}는 ${escapeHtml(content.site.tagline)}</p><p>이 사이트는 AI 도구를 마법처럼 포장하지 않고, 초보자가 실제로 적용할 수 있는 기준과 체크리스트를 제공합니다.</p><h2>다루는 주제</h2><p>${escapeHtml(content.site.topic)}</p><h2>콘텐츠 운영 기준</h2><ul>${content.site.editorialPrinciples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      },
      contact: {
        title: "문의하기",
        body: `<p>문의와 제안은 이메일 기반으로 받고 있습니다. 아래 폼은 정적 사이트용 안내 UI이며 실제 메일 전송 기능은 포함되어 있지 않습니다.</p><p><strong>이메일:</strong> <a class="text-link" href="mailto:${escapeHtml(content.site.email)}">${escapeHtml(content.site.email)}</a></p><form class="contact-form"><label>이름<input type="text" placeholder="이름"></label><label>이메일<input type="email" placeholder="reply@example.com"></label><label>문의 내용<textarea placeholder="문의 내용을 적은 뒤 이메일로 보내주세요."></textarea></label><button class="btn" type="button" onclick="alert('정적 사이트 안내 폼입니다. 실제 발송은 이메일을 이용해주세요.')">문의 내용 확인</button></form>`
      },
      privacy: {
        title: "개인정보처리방침",
        body: `<p>${escapeHtml(content.site.siteName)}는 현재 회원가입, 결제, 댓글 기능을 운영하지 않으며 문의는 이메일을 통해 접수합니다.</p><h2>수집하는 정보</h2><p>이메일 문의 시 사용자가 직접 제공한 이름, 이메일 주소, 문의 내용이 확인될 수 있습니다. 해당 정보는 문의 답변과 기록 관리를 위해 필요한 범위에서만 사용합니다.</p><h2>보관과 삭제</h2><p>문의 내용은 처리 목적이 끝난 뒤 합리적인 기간 내 정리할 수 있습니다. 삭제 요청은 ${escapeHtml(content.site.email)}로 보내실 수 있습니다.</p><h2>외부 서비스</h2><p>정적 사이트 배포 환경, 브라우저, 검색엔진 도구에서 일반적인 접속 로그나 색인 정보가 처리될 수 있습니다. 이 사이트는 민감한 개인정보 입력을 요구하지 않습니다.</p><h2>변경 안내</h2><p>정책이 변경될 경우 본 페이지에 수정일을 반영해 안내합니다.</p>`
      },
      terms: {
        title: "이용약관",
        body: `<p>본 약관은 ${escapeHtml(content.site.siteName)} 이용과 관련한 기본 사항을 안내합니다.</p><h2>콘텐츠 이용</h2><p>사이트의 글은 정보 제공을 목적으로 하며, 무단 복제나 상업적 재배포는 제한될 수 있습니다. 필요한 경우 출처를 표시하고 링크 형태로 공유해 주세요.</p><h2>서비스 변경</h2><p>사이트 구조, 콘텐츠, 운영 방식은 개선을 위해 사전 고지 없이 변경될 수 있습니다.</p><h2>이용자 책임</h2><p>콘텐츠를 실제 업무에 적용할 때에는 사용자의 상황에 맞게 검토해야 하며, 중요한 의사결정은 별도 확인을 거쳐야 합니다.</p><h2>문의</h2><p>약관 관련 문의는 ${escapeHtml(content.site.email)}로 연락해 주세요.</p>`
      },
      disclaimer: {
        title: "면책고지",
        body: `<p>${escapeHtml(content.site.siteName)}의 콘텐츠는 AI 활용과 생산성 개선을 돕기 위한 일반 정보입니다.</p><h2>정보의 한계</h2><p>도구 기능, 요금제, 정책은 시간이 지나며 바뀔 수 있습니다. 글은 작성 및 수정 시점의 일반적인 사용 맥락을 바탕으로 하며, 실시간 변경 사항을 모두 반영하지 못할 수 있습니다.</p><h2>전문 자문 아님</h2><p>본 사이트는 법률, 세무, 금융, 의료 등 전문 자문을 제공하지 않습니다. 중요한 결정에는 관련 전문가나 공식 자료를 확인해 주세요.</p><h2>사용자 판단</h2><p>AI가 만든 결과물은 사용자가 직접 검토해야 하며, 실제 업무 적용 결과에 대한 최종 책임은 사용자에게 있습니다.</p>`
      }
    };
    const page = pages[type];
    layout(content, `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { label: page.title }])}<h1>${page.title}</h1></div></section><section class="section"><div class="container legal-page article-body">${page.body}</div></section>`);
  }

  function renderSitemap(content) {
    layout(
      content,
      `<section class="page-hero"><div class="container">${breadcrumbs([{ href: "/", label: "홈" }, { label: "사이트맵" }])}<h1>사이트맵</h1><p class="lead">사이트의 주요 페이지와 글을 한곳에서 확인할 수 있습니다.</p></div></section>
      <section class="section"><div class="container grid cols-2">
        <div class="card"><h2>주요 페이지</h2><ul>${[
          ["/about/", "사이트 소개"],
          ["/author/", "운영자 소개"],
          ["/categories/", "카테고리"],
          ["/columns/", "운영자 칼럼"],
          ["/contact/", "문의하기"],
          ["/privacy/", "개인정보처리방침"],
          ["/terms/", "이용약관"],
          ["/disclaimer/", "면책고지"]
        ]
          .map(([href, label]) => `<li><a class="text-link" href="${href}">${label}</a></li>`)
          .join("")}</ul></div>
        <div class="card"><h2>카테고리</h2><ul>${content.categories.map((category) => `<li><a class="text-link" href="/categories/${category.slug}/">${escapeHtml(category.name)}</a></li>`).join("")}</ul></div>
        <div class="card"><h2>일반 글</h2><ul>${sortRecent(content.posts).map((post) => `<li><a class="text-link" href="/posts/${post.slug}/">${escapeHtml(post.title)}</a></li>`).join("")}</ul></div>
        <div class="card"><h2>칼럼</h2><ul>${sortRecent(content.columns).map((column) => `<li><a class="text-link" href="/columns/${column.slug}/">${escapeHtml(column.title)}</a></li>`).join("")}</ul></div>
      </div></section>`
    );
  }

  function renderNotFound(content) {
    layout(
      content,
      `<section class="page-hero"><div class="container"><h1>페이지를 찾을 수 없습니다</h1><p class="lead">주소가 바뀌었거나 아직 생성되지 않은 페이지입니다.</p><div class="button-row"><a class="btn" href="/">홈으로 이동</a><a class="btn secondary" href="/sitemap/">사이트맵 보기</a></div></div></section>`
    );
  }

  function renderAdmin(content) {
    root.innerHTML = `
      <header class="site-header"><div class="header-inner"><a class="brand" href="/"><span class="brand-mark">AI</span><span>${escapeHtml(content.site.siteName)}</span></a><a class="btn secondary" href="/">사이트 보기</a></div></header>
      <main class="admin-shell" id="main">${isAdmin() ? adminApp(content) : adminLogin(content)}</main>
    `;
    if (isAdmin()) bindAdmin(content);
    else bindLogin(content);
  }

  function adminLogin(content) {
    return `
      <section class="admin-login card">
        <h1>CMS-lite 관리자 로그인</h1>
        <p class="notice">${escapeHtml(content.site.adminNotice)}</p>
        <p>관리자 계정은 정적 사이트 데모용 입력값입니다. 실제 보안 인증이 아니며 브라우저 저장소 상태만 사용합니다.</p>
        <label>아이디<input id="admin-username" type="text" autocomplete="username" placeholder="admin"></label>
        <label>비밀번호<input id="admin-password" type="password" autocomplete="current-password" placeholder="비밀번호"></label>
        <div class="button-row"><button class="btn" id="admin-login-btn" type="button">로그인</button></div>
      </section>
    `;
  }

  function bindLogin(content) {
    const login = () => {
      const username = document.getElementById("admin-username").value.trim();
      const password = document.getElementById("admin-password").value;
      if (username !== "admin" || password !== "eportal7") {
        alert("아이디 또는 비밀번호가 다릅니다.");
        return;
      }
      localStorage.setItem(sessionKey, "true");
      location.hash = "dashboard";
      renderAdmin(content);
    };
    document.getElementById("admin-login-btn").addEventListener("click", login);
    document.getElementById("admin-password").addEventListener("keydown", (event) => {
      if (event.key === "Enter") login();
    });
  }

  function adminApp(content) {
    const active = (location.hash || "#dashboard").replace("#", "");
    const menu = [
      ["dashboard", "대시보드"],
      ["posts", "일반 글 관리"],
      ["posts-new", "새 글 작성"],
      ["columns", "칼럼 관리"],
      ["columns-new", "새 칼럼 작성"],
      ["categories-admin", "카테고리"],
      ["settings", "사이트 설정"],
      ["data", "데이터 관리"]
    ];
    return `
      <div class="admin-app">
        <aside class="admin-sidebar">
          <h2>관리자</h2>
          <p style="color:#9ca3af;font-size:14px;">정적 CMS-lite</p>
          ${menu.map(([key, label]) => `<button type="button" data-admin-tab="${key}" class="${active === key ? "active" : ""}">${label}</button>`).join("")}
          <a href="/author/">운영자 페이지</a>
          <button type="button" id="admin-logout">로그아웃</button>
        </aside>
        <section class="admin-main">
          <div class="admin-top"><div><h1>워드프레스 느낌의 CMS-lite</h1><p>${escapeHtml(content.site.adminNotice)}</p></div><a class="btn secondary" href="/author/">칼럼 허브 확인</a></div>
          <div id="admin-panel">${adminPanel(content, active)}</div>
        </section>
      </div>
    `;
  }

  function adminPanel(content, active) {
    if (active === "posts-new") return editorForm(content, "post");
    if (active === "columns-new") return editorForm(content, "column");
    if (active === "posts") return contentList(content, "post");
    if (active === "columns") return contentList(content, "column");
    if (active === "categories-admin") return categoryAdmin(content);
    if (active === "settings") return settingsForm(content);
    if (active === "data") return dataManager(content);
    return dashboard(content);
  }

  function dashboard(content) {
    const published = content.posts.filter((post) => post.status === "published").length;
    const drafts = content.posts.filter((post) => post.status === "draft").length;
    return `
      <div class="stat-grid">
        <div class="stat"><span>총 글 수</span><strong>${content.posts.length}</strong></div>
        <div class="stat"><span>총 칼럼 수</span><strong>${content.columns.length}</strong></div>
        <div class="stat"><span>카테고리 수</span><strong>${content.categories.length}</strong></div>
        <div class="stat"><span>추천 글 수</span><strong>${content.posts.filter((post) => post.featured).length}</strong></div>
      </div>
      <section class="card" style="margin-top:18px;"><h2>발행 상태</h2><p>발행 ${published}개 · 초안 ${drafts}개</p></section>
      <section class="card" style="margin-top:18px;"><h2>최근 수정 콘텐츠</h2><div class="table-list">${sortRecent([...content.posts, ...content.columns]).slice(0, 6).map((item) => `<div class="table-item"><div><strong>${escapeHtml(item.title)}</strong><div class="meta"><span>${formatDate(item.updatedAt)}</span><span>${escapeHtml(item.status || "published")}</span></div></div><a class="btn secondary" href="${content.posts.includes(item) ? `/posts/${item.slug}/` : `/columns/${item.slug}/`}">보기</a></div>`).join("")}</div></section>
    `;
  }

  function contentList(content, type) {
    const list = type === "post" ? content.posts : content.columns;
    const label = type === "post" ? "일반 글" : "칼럼";
    return `
      <div class="admin-top"><h2>${label} 목록</h2><button class="btn" data-admin-tab="${type === "post" ? "posts-new" : "columns-new"}">새 ${label} 작성</button></div>
      <div class="table-list">${list
        .map(
          (item, index) => `
          <div class="table-item">
            <div><strong>${escapeHtml(item.title)}</strong><div class="meta"><span>${escapeHtml(item.slug)}</span><span>${formatDate(item.updatedAt)}</span><span>${escapeHtml(item.status || "published")}</span></div></div>
            <div class="button-row"><button class="btn secondary" data-edit="${type}:${index}">수정</button><button class="btn danger" data-delete="${type}:${index}">삭제</button></div>
          </div>`
        )
        .join("")}</div>
    `;
  }

  function editorForm(content, type, index = null) {
    const isPost = type === "post";
    const source = index === null ? null : isPost ? content.posts[index] : content.columns[index];
    const item = source || {
      title: "",
      slug: "",
      subtitle: "",
      summary: "",
      category: content.categories[0]?.slug || "",
      author: content.site.authorName,
      publishedAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      featured: false,
      status: "draft",
      readingMinutes: 5,
      sections: [{ heading: "문제 제기", body: [""] }],
      body: [{ heading: "칼럼 메모", paragraphs: [""] }],
      keyPoints: [],
      mistakes: [],
      checklist: [],
      faq: [],
      relatedSlugs: []
    };
    const bodyText = isPost
      ? (item.sections || []).map((section) => `## ${section.heading}\n${(section.body || []).join("\n\n")}`).join("\n\n")
      : (item.body || []).map((section) => `## ${section.heading}\n${(section.paragraphs || []).join("\n\n")}`).join("\n\n");
    return `
      <section class="card">
        <h2>${isPost ? "일반 글" : "운영자 칼럼"} ${index === null ? "작성" : "수정"}</h2>
        <form class="admin-form" id="editor-form" data-type="${type}" data-index="${index === null ? "" : index}">
          <label>제목<input name="title" value="${escapeHtml(item.title)}" required></label>
          <label>슬러그<input name="slug" value="${escapeHtml(item.slug)}" placeholder="short-readable-slug" required></label>
          <label class="full">요약 문장<input name="subtitle" value="${escapeHtml(item.subtitle || "")}"></label>
          <label class="full">설명<textarea name="summary">${escapeHtml(item.summary || "")}</textarea></label>
          ${isPost ? `<label>카테고리<select name="category">${content.categories.map((category) => `<option value="${category.slug}" ${item.category === category.slug ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("")}</select></label>` : ""}
          <label>작성자<input name="author" value="${escapeHtml(item.author || content.site.authorName)}"></label>
          <label>발행일<input name="publishedAt" type="date" value="${escapeHtml(item.publishedAt)}"></label>
          <label>수정일<input name="updatedAt" type="date" value="${escapeHtml(item.updatedAt)}"></label>
          <label>읽기 시간<input name="readingMinutes" type="number" min="1" value="${escapeHtml(item.readingMinutes || 5)}"></label>
          <label>발행 상태<select name="status"><option value="published" ${item.status === "published" ? "selected" : ""}>발행</option><option value="draft" ${item.status === "draft" ? "selected" : ""}>초안</option></select></label>
          ${isPost ? `<label><span><input name="featured" type="checkbox" ${item.featured ? "checked" : ""}> 추천 글</span></label>` : ""}
          <label class="full">본문<textarea name="body" placeholder="## 소제목&#10;본문 문단">${escapeHtml(bodyText)}</textarea></label>
          ${isPost ? `<label class="full">핵심 요약(줄바꿈 구분)<textarea name="keyPoints">${escapeHtml((item.keyPoints || []).join("\n"))}</textarea></label><label class="full">실수 포인트(줄바꿈 구분)<textarea name="mistakes">${escapeHtml((item.mistakes || []).join("\n"))}</textarea></label><label class="full">체크리스트(줄바꿈 구분)<textarea name="checklist">${escapeHtml((item.checklist || []).join("\n"))}</textarea></label><label class="full">FAQ(질문 | 답변 형식, 줄바꿈 구분)<textarea name="faq">${escapeHtml((item.faq || []).map((faq) => `${faq.question} | ${faq.answer}`).join("\n"))}</textarea></label>` : ""}
          <label class="full">관련 글 슬러그(쉼표 구분)<input name="relatedSlugs" value="${escapeHtml((item.relatedSlugs || []).join(", "))}"></label>
          <div class="button-row full"><button class="btn" type="submit">저장</button><button class="btn secondary" type="button" id="preview-btn">미리보기</button></div>
        </form>
        <div id="preview-panel" class="preview-panel hidden"></div>
      </section>
    `;
  }

  function parseBody(text, isPost) {
    return text
      .split(/\n(?=## )/g)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const lines = chunk.split("\n");
        const heading = lines.shift().replace(/^##\s*/, "").trim() || "본문";
        const paragraphs = lines.join("\n").split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);
        return isPost ? { heading, body: paragraphs } : { heading, paragraphs };
      });
  }

  function categoryAdmin(content) {
    return `<section class="card"><h2>카테고리</h2><p>카테고리는 현재 데이터 구조를 보여주는 관리 UI입니다. 영구 반영은 JSON export 후 data/categories.js에 반영하세요.</p><div class="table-list">${content.categories.map((category) => `<div class="table-item"><div><strong>${escapeHtml(category.name)}</strong><p>${escapeHtml(category.description)}</p><div class="meta">${escapeHtml(category.slug)}</div></div></div>`).join("")}</div></section>`;
  }

  function settingsForm(content) {
    const site = content.site;
    return `
      <section class="card"><h2>사이트 설정</h2><form class="admin-form" id="settings-form">
        ${[
          ["siteName", "사이트명"],
          ["tagline", "한줄 소개"],
          ["authorName", "운영자명"],
          ["authorBio", "운영자 소개 문구"],
          ["email", "이메일"],
          ["mainColor", "메인 컬러"],
          ["subColor", "서브 컬러"],
          ["baseUrl", "기본 도메인"]
        ]
          .map(([key, label]) => `<label>${label}<input name="${key}" value="${escapeHtml(site[key] || "")}"></label>`)
          .join("")}
        <div class="button-row full"><button class="btn" type="submit">설정 저장</button></div>
      </form></section>`;
  }

  function dataManager(content) {
    return `
      <section class="card">
        <h2>JSON export / import</h2>
        <p class="notice">이 데이터는 브라우저 localStorage에 저장됩니다. 기기나 브라우저가 바뀌면 유지되지 않을 수 있으며, 실제 데이터 파일 반영은 export 후 data 파일에 옮겨야 합니다.</p>
        <div class="button-row"><button class="btn" id="export-json">JSON export</button><button class="btn secondary" id="reset-data">기본 데이터로 초기화</button></div>
        <label style="margin-top:16px;">JSON import<textarea id="import-json" placeholder="export한 JSON을 붙여넣으세요."></textarea></label>
        <button class="btn" id="import-json-btn" type="button">JSON import</button>
      </section>`;
  }

  function bindAdmin(content) {
    root.querySelectorAll("[data-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = button.dataset.adminTab;
        renderAdmin(getContent());
      });
    });
    document.getElementById("admin-logout").addEventListener("click", () => {
      localStorage.removeItem(sessionKey);
      renderAdmin(getContent());
    });
    root.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const [type, index] = button.dataset.edit.split(":");
        document.getElementById("admin-panel").innerHTML = editorForm(getContent(), type, Number(index));
        bindAdmin(getContent());
      });
    });
    root.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const [type, index] = button.dataset.delete.split(":");
        if (!confirm("이 항목을 브라우저 저장소에서 삭제할까요?")) return;
        const next = getContent();
        (type === "post" ? next.posts : next.columns).splice(Number(index), 1);
        saveContent(next);
        renderAdmin(next);
      });
    });
    const form = document.getElementById("editor-form");
    if (form) bindEditorForm(form);
    const settings = document.getElementById("settings-form");
    if (settings) bindSettings(settings);
    const exportButton = document.getElementById("export-json");
    if (exportButton) bindDataButtons();
  }

  function bindEditorForm(form) {
    const collect = () => {
      const data = new FormData(form);
      const isPost = form.dataset.type === "post";
      const item = {
        slug: slugify(data.get("slug") || data.get("title")),
        title: data.get("title"),
        subtitle: data.get("subtitle"),
        summary: data.get("summary"),
        author: data.get("author") || getContent().site.authorName,
        publishedAt: data.get("publishedAt"),
        updatedAt: data.get("updatedAt"),
        readingMinutes: Number(data.get("readingMinutes")) || 5,
        status: data.get("status"),
        relatedSlugs: String(data.get("relatedSlugs") || "").split(",").map((item) => item.trim()).filter(Boolean)
      };
      if (isPost) {
        item.category = data.get("category");
        item.featured = data.get("featured") === "on";
        item.sections = parseBody(data.get("body"), true);
        item.keyPoints = String(data.get("keyPoints") || "").split("\n").map((line) => line.trim()).filter(Boolean);
        item.mistakes = String(data.get("mistakes") || "").split("\n").map((line) => line.trim()).filter(Boolean);
        item.checklist = String(data.get("checklist") || "").split("\n").map((line) => line.trim()).filter(Boolean);
        item.faq = String(data.get("faq") || "").split("\n").map((line) => {
          const [question, answer] = line.split("|").map((part) => part && part.trim());
          return question && answer ? { question, answer } : null;
        }).filter(Boolean);
      } else {
        item.body = parseBody(data.get("body"), false);
      }
      return item;
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const content = getContent();
      const list = form.dataset.type === "post" ? content.posts : content.columns;
      const index = form.dataset.index === "" ? -1 : Number(form.dataset.index);
      const item = collect();
      if (index >= 0) list[index] = item;
      else list.unshift(item);
      saveContent(content);
      alert("브라우저 저장소에 저장했습니다. 실제 배포 파일 반영은 JSON export 후 data 파일에 반영해야 합니다.");
      renderAdmin(content);
    });
    document.getElementById("preview-btn").addEventListener("click", () => {
      const item = collect();
      document.getElementById("preview-panel").classList.remove("hidden");
      document.getElementById("preview-panel").innerHTML = `<h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><div class="meta"><span>${escapeHtml(item.status)}</span><span>${escapeHtml(item.slug)}</span></div>`;
    });
  }

  function bindSettings(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const content = getContent();
      const data = new FormData(form);
      for (const [key, value] of data.entries()) content.site[key] = value;
      saveContent(content);
      alert("사이트 설정을 브라우저 저장소에 저장했습니다.");
      renderAdmin(content);
    });
  }

  function bindDataButtons() {
    document.getElementById("export-json").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(getContent(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-lab-cms-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("reset-data").addEventListener("click", () => {
      if (!confirm("브라우저 저장 데이터를 기본값으로 초기화할까요?")) return;
      localStorage.removeItem(storeKey);
      renderAdmin(getContent());
    });
    document.getElementById("import-json-btn").addEventListener("click", () => {
      try {
        const parsed = JSON.parse(document.getElementById("import-json").value);
        saveContent(parsed);
        alert("가져오기가 완료되었습니다.");
        renderAdmin(getContent());
      } catch (error) {
        alert("JSON 형식을 확인해 주세요.");
      }
    });
  }

  function route() {
    const content = getContent();
    const parts = location.pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
    const first = parts[0] || "";
    if (!first) return renderHome(content);
    if (first === "admin") return renderAdmin(content);
    if (first === "categories" && !parts[1]) return renderCategoryIndex(content);
    if (first === "categories" && parts[1]) return renderCategory(content, parts[1]);
    if (first === "posts" && parts[1]) return renderPost(content, parts[1]);
    if (first === "columns" && !parts[1]) return renderColumns(content);
    if (first === "columns" && parts[1]) return renderColumn(content, parts[1]);
    if (first === "author") return renderAuthor(content);
    if (["about", "contact", "privacy", "terms", "disclaimer"].includes(first)) return renderStaticPage(content, first);
    if (first === "sitemap") return renderSitemap(content);
    return renderNotFound(content);
  }

  route();
})();
