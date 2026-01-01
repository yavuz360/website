// Progressive enhancement indicator
document.body.classList.remove('no-js');

/* ===== Mobile nav toggle ===== */
const navToggle = document.querySelector('.nav__toggle');
const navList = document.querySelector('#nav-list');
if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.getAttribute('data-open') === 'true';
    navList.setAttribute('data-open', String(!open));
    navToggle.setAttribute('aria-expanded', String(!open));
  });
}

/* ===== Theme toggle ===== */
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

// Apply saved theme globally across all pages
const saved = localStorage.getItem('theme');
if (saved) {
  root.setAttribute('data-theme', saved);
} else {
  // Set default based on system preference
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const defaultTheme = prefersDark ? 'dark' : 'light';
  root.setAttribute('data-theme', defaultTheme);
  localStorage.setItem('theme', defaultTheme);
}

// keep browser address bar color in sync (mobile)
const setThemeColorMeta = (hex) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', hex);
};

const applyTheme = (mode) => {
  root.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
  setThemeColorMeta(mode === 'dark' ? '#0c0d12' : '#ffffff');
};

themeToggle?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ===== “Back to top” smooth scroll ===== */
const toTop = document.querySelector('.to-top');
toTop?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== Blog System ===== */
class BlogSystem {
  constructor() {
    // Configuration - local file path
    this.entriesFile = './entries.txt';
    this.currentPage = 1;
    this.postsPerPage = 3;
    this.currentCategory = 'current'; // 'current' or 'archived'
    this.allPosts = []; // Cache for parsed posts
    
    // DOM elements
    this.blogContainer = document.getElementById('blog-posts');
    this.noPostsElement = document.getElementById('no-posts');
    
    // Only initialize if we're on the blogs page
    if (this.blogContainer) {
      this.init();
    }
  }

  async init() {
    console.log('BlogSystem initialized');
    this.setupControls();
    await this.loadBlogPage();
  }

  setupControls() {
    // Setup category buttons
    const currentBtn = document.getElementById('category-latest');
    const archivedBtn = document.getElementById('category-archived');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    // Update button text
    if (currentBtn) {
      currentBtn.textContent = 'Current';
      currentBtn.addEventListener('click', () => this.switchCategory('current'));
    }
    if (archivedBtn) {
      archivedBtn.textContent = 'Archived';
      archivedBtn.addEventListener('click', () => this.switchCategory('archived'));
    }
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
  }

  async switchCategory(category) {
    this.currentCategory = category;
    this.currentPage = 1;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = category === 'current' ? 'category-latest' : 'category-archived';
    document.getElementById(targetBtn).classList.add('active');
    
    await this.loadBlogPage();
  }

  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.loadBlogPage();
    }
  }

  async nextPage() {
    this.currentPage++;
    const posts = this.getPostsForPage(this.currentPage, this.currentCategory);
    
    if (posts.length === 0) {
      // No posts on next page, revert
      this.currentPage--;
      return;
    }
    
    await this.loadBlogPage();
  }

  async loadBlogPage() {
    this.showLoading();
    
    try {
      // Load all posts if not cached
      if (this.allPosts.length === 0) {
        await this.loadAllPosts();
      }
      
      const posts = this.getPostsForPage(this.currentPage, this.currentCategory);
      
      console.log(`Page ${this.currentPage} loaded:`, posts.length, 'posts');

      if (posts.length === 0 && this.currentPage === 1) {
        this.showNoPosts();
        return;
      }

      this.renderBlogList(posts);
      this.updatePaginationControls();
    } catch (error) {
      console.error('Error loading blog page:', error);
      this.showError();
    }
  }

  async loadAllPosts() {
    try {
      console.log(`Fetching: ${this.entriesFile}`);
      const response = await fetch(this.entriesFile);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch entries file: ${response.status}`);
      }
      
      const content = await response.text();
      this.allPosts = this.parseEntriesFile(content);
      console.log(`Loaded ${this.allPosts.length} total posts`);
    } catch (error) {
      console.error('Error loading entries file:', error);
      throw error;
    }
  }

  parseEntriesFile(content) {
    const posts = [];
    const sections = content.split('-------------').filter(section => section.trim());
    
    sections.forEach((section, index) => {
      const post = this.parseSinglePost(section.trim(), index);
      if (post) {
        posts.push(post);
      }
    });
    
    return posts;
  }

  parseSinglePost(section, index) {
    const lines = section.split('\n');
    
    // Find [POST] header
    const postHeaderIndex = lines.findIndex(line => line.trim() === '[POST]');
    if (postHeaderIndex === -1) {
      console.warn(`No [POST] header found in section ${index}`);
      return null;
    }
    
    // Parse metadata
    let title = '', type = 'current', date = '';
    let metadataEndIndex = postHeaderIndex + 1;
    
    for (let i = postHeaderIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') {
        metadataEndIndex = i;
        break;
      }
      
      if (line.startsWith('title:')) {
        title = line.substring(6).trim();
      } else if (line.startsWith('type:')) {
        type = line.substring(5).trim();
      } else if (line.startsWith('date:')) {
        date = line.substring(5).trim();
      }
    }
    
    if (!title) {
      console.warn(`No title found in section ${index}`);
      return null;
    }
    
    // Find content (between metadata and --Links-- or end)
    const contentStartIndex = metadataEndIndex + 1;
    const contentLines = lines.slice(contentStartIndex);
    const linksIndex = contentLines.findIndex(line => line.trim() === '--Links--');
    
    let content_text, links = {};
    
    if (linksIndex !== -1) {
      content_text = contentLines.slice(0, linksIndex).join('\n').trim();
      const linkLines = contentLines.slice(linksIndex + 1);
      links = this.parseLinks(linkLines);
    } else {
      content_text = contentLines.join('\n').trim();
    }
    
    // Parse date or use current time
    let timestamp;
    if (date) {
      timestamp = new Date(date).getTime();
    } else {
      timestamp = Date.now() - (index * 86400000); // Subtract days for ordering
    }
    
    return {
      title,
      type,
      date,
      timestamp,
      content: content_text,
      links,
      index
    };
  }

  getPostsForPage(page, category) {
    // Filter posts by category
    const filteredPosts = this.allPosts.filter(post => post.type === category);
    
    // Sort by timestamp (newest first)
    filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Paginate
    const startIndex = (page - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    
    return filteredPosts.slice(startIndex, endIndex);
  }


  parseLinks(linkLines) {
    const links = {};
    
    for (const line of linkLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check for disabled link format: "Text*-Reason"
      const disabledMatch = trimmed.match(/^(.+?)(\*+)-(.*)$/);
      if (disabledMatch) {
        const [, text, asterisks, reason] = disabledMatch;
        const key = text + asterisks;
        links[key] = {
          disabled: true,
          value: reason || 'No reason given'
        };
        continue;
      }
      
      // Check for normal link format: "Text*=URL"
      const normalMatch = trimmed.match(/^(.+?)(\*+)=(.+)$/);
      if (normalMatch) {
        const [, text, asterisks, url] = normalMatch;
        const key = text + asterisks;
        links[key] = {
          disabled: false,
          value: url.trim()
        };
      }
    }
    
    return links;
  }

  showLoading() {
    if (this.blogContainer) {
      this.blogContainer.innerHTML = '<div class="loading">Loading blog posts...</div>';
    }
    if (this.noPostsElement) {
      this.noPostsElement.style.display = 'none';
    }
  }

  showNoPosts() {
    if (this.blogContainer) {
      this.blogContainer.style.display = 'none';
    }
    if (this.noPostsElement) {
      this.noPostsElement.style.display = 'block';
    }
  }

  showError() {
    if (this.blogContainer) {
      this.blogContainer.innerHTML = `
        <div class="loading">
          Failed to load blog posts. Please try again later.
        </div>
      `;
    }
  }

  renderBlogList(posts) {
    if (!this.blogContainer) return;

    if (posts.length === 0) {
      this.blogContainer.innerHTML = '<div class="loading">No posts found on this page.</div>';
      return;
    }

    let html = '';
    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const formattedDate = post.date || date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });

      // Process content for cross-references
      const processedContent = this.processContentWithCrossReferences(post.content, post.links);

      html += `
        <article class="blog-post" data-post-index="${post.index}">
          <div class="blog-post-meta">
            <time datetime="${date.toISOString()}">${formattedDate}</time>
            <span class="post-type" data-type="${post.type}">${post.type}</span>
          </div>
          <h2 class="blog-post-title">${this.escapeHtml(post.title)}</h2>
          <div class="blog-post-content">
            ${processedContent}
          </div>
          ${this.generateLinkButtons(post.links)}
        </article>
      `;
    });

    this.blogContainer.innerHTML = html;
    this.blogContainer.style.display = 'flex';
    this.setupInteractiveLinks();
  }

  processContentWithCrossReferences(content, links) {
    let processedContent = content;
    
    // First, handle cross-references to other posts
    const crossRefRegex = /([^*\s]+(?:\s+[^*\s]+)*)\*/g;
    processedContent = processedContent.replace(crossRefRegex, (match, title) => {
      const cleanTitle = title.trim();
      
      // Check if this is a link in the current post
      const isCurrentPostLink = Object.keys(links).some(linkKey => 
        linkKey.startsWith(cleanTitle)
      );
      
      if (isCurrentPostLink) {
        // Handle as regular link
        const linkKey = Object.keys(links).find(key => key.startsWith(cleanTitle));
        const spanId = `marker-${this.escapeHtml(linkKey).replace(/[^a-zA-Z0-9]/g, '-')}`;
        return `<span class="asterisk-link" data-target="${this.escapeHtml(linkKey)}" id="${spanId}">${this.escapeHtml(match)}</span>`;
      } else {
        // Check if it's a cross-reference to another post
        const referencedPost = this.allPosts.find(post => 
          post.title.toLowerCase().includes(cleanTitle.toLowerCase()) ||
          cleanTitle.toLowerCase().includes(post.title.toLowerCase())
        );
        
        if (referencedPost) {
          return `<span class="cross-reference" data-post-title="${this.escapeHtml(referencedPost.title)}" title="Cross-reference to: ${this.escapeHtml(referencedPost.title)}">${this.escapeHtml(match)}</span>`;
        }
      }
      
      return match; // Return unchanged if no match found
    });
    
    // Then handle regular link markers
    for (const linkKey in links) {
      const escapedKey = this.escapeRegex(linkKey);
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
      const spanId = `marker-${this.escapeHtml(linkKey).replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      processedContent = processedContent.replace(regex, 
        `<span class="asterisk-link" data-target="${this.escapeHtml(linkKey)}" id="${spanId}">${this.escapeHtml(linkKey)}</span>`
      );
    }
    
    return processedContent;
  }

  generateLinkButtons(links) {
    if (Object.keys(links).length === 0) return '';
    
    const buttons = Object.entries(links).map(([linkKey, linkData]) => {
      const buttonId = `link-${this.escapeHtml(linkKey).replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      // Extract display text (everything before the asterisks)
      const displayText = linkKey.replace(/\*+$/, '');
      
      if (linkData.disabled) {
        return `<button class="link-button" id="${buttonId}" data-disabled="true" data-reason="${this.escapeHtml(linkData.value)}">
                    <span class="link-icon">📎</span>
                    <span class="link-text">${this.escapeHtml(displayText)}</span>
                </button>`;
      } else {
        return `<a href="${this.escapeHtml(linkData.value)}" class="link-button" id="${buttonId}" target="_blank" rel="noopener">
                    <span class="link-icon">📎</span>
                    <span class="link-text">${this.escapeHtml(displayText)}</span>
                </a>`;
      }
    }).join('');
    
    return `
      <div class="blog-post-resources">
        <h3>Resources</h3>
        <div class="resource-buttons">
          ${buttons}
        </div>
      </div>
    `;
  }

  setupInteractiveLinks() {
    // Setup asterisk link handlers
    document.querySelectorAll('.asterisk-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        const targetButton = document.getElementById(`link-${target.replace(/[^a-zA-Z0-9]/g, '-')}`);
        
        if (targetButton) {
          // Smooth scroll to button
          targetButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Highlight button
          targetButton.classList.add('highlighted');
          setTimeout(() => {
            targetButton.classList.remove('highlighted');
          }, 2000);
        }
      });
    });

    // Setup disabled button handlers
    document.querySelectorAll('.link-button[data-disabled="true"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const reason = button.getAttribute('data-reason') || '';
        this.showNotAvailablePopup(reason);
      });
    });
  }

  showNotAvailablePopup(reason) {
    const overlay = document.createElement('div');
    overlay.className = 'not-available-overlay';
    
    const reasonText = reason ? reason : 'No reason given';
    
    overlay.innerHTML = `
      <div class="not-available-popup">
        <button class="popup-close" aria-label="Close">&times;</button>
        <h3>🚫 Not Available</h3>
        <p>${this.escapeHtml(reasonText)}</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Show popup with animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Setup close handlers
    const closePopup = () => {
      overlay.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    };

    overlay.querySelector('.popup-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });
  }

  updatePaginationControls() {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (pageInfo) pageInfo.textContent = `Page ${this.currentPage}`;
    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    
    // Check if next page has content
    this.checkNextPageAvailable().then(hasNext => {
      if (nextBtn) nextBtn.disabled = !hasNext;
    });
  }

  async checkNextPageAvailable() {
    const nextPagePosts = this.getPostsForPage(this.currentPage + 1, this.currentCategory);
    return nextPagePosts.length > 0;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/* ===== Translation System ===== */
class TranslationSystem {
  constructor() {
    this.defaultLanguage = 'en';
    this.currentLanguage = this.defaultLanguage;
    this.translations = {};
    this.languages = {
      'en': { flag: 'gb.png', name: 'English' },
      'tr': { flag: 'tr.png', name: 'Türkçe' },
      'de': { flag: 'de.png', name: 'Deutsch' }
    };
    
    this.init();
  }

  async init() {
    await this.loadTranslations();
    this.setupLanguageToggle();
    const detectedLanguage = this.detectLanguageFromBrowser();
    const initialLanguage = detectedLanguage || this.getStoredLanguage() || this.defaultLanguage;
    this.setLanguage(initialLanguage);
    this.updateFlag();
    this.translatePage();
    this.showDisclaimerPopup();
  }

  async loadTranslations() {
    try {
      const response = await fetch('./translations.json');
      const data = await response.json();
      this.translations = data.website_translations;
      console.log('Translations loaded:', Object.keys(this.translations));
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  setupLanguageToggle() {
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
      languageToggle.addEventListener('click', () => {
        this.cycleLanguage();
      });
    }
  }

  cycleLanguage() {
    const languages = Object.keys(this.languages);
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    
    this.setLanguage(languages[nextIndex]);
    
    this.updateFlag();
    this.translatePage();
  }

  getStoredLanguage() {
    const stored = localStorage.getItem('website-language');
    return stored && this.languages[stored] ? stored : null;
  }

  setLanguage(language) {
    const normalized = this.languages[language] ? language : this.defaultLanguage;
    this.currentLanguage = normalized;
    localStorage.setItem('website-language', normalized);
  }

  detectLanguageFromBrowser() {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const candidate of candidates) {
      const normalized = this.normalizeLanguage(candidate);
      if (normalized && this.languages[normalized]) {
        return normalized;
      }
    }
    return null;
  }

  normalizeLanguage(language) {
    if (!language) return null;
    return language.toLowerCase().split('-')[0];
  }

  updateFlag() {
    const flagIcon = document.getElementById('current-flag');
    if (flagIcon && this.languages[this.currentLanguage]) {
      const lang = this.languages[this.currentLanguage];
      flagIcon.src = `assets/${lang.flag}`;
      flagIcon.alt = lang.name;
    }
  }

  translatePage() {
    if (!this.translations[this.currentLanguage]) {
      console.warn(`No translations found for language: ${this.currentLanguage}`);
      return;
    }

    const t = this.translations[this.currentLanguage];
    document.documentElement.setAttribute('lang', this.currentLanguage);
    
    // Update page title
    if (t.meta) {
      const currentPage = this.getCurrentPage();
      if (currentPage === 'blogs' && t.blog?.title) {
        document.title = t.blog.title;
      } else if (currentPage === '404' && t.error_404?.title) {
        document.title = t.error_404.title;
      } else if (t.hero?.name) {
        document.title = t.hero.name;
      }
    }

    // Navigation
    this.updateText('nav a[href*="about"]', t.navigation?.about_me);
    this.updateText('nav a[href*="blogs"]', t.navigation?.blogs);
    this.updateAttribute('.nav__toggle .visually-hidden', 'textContent', t.navigation?.toggle_menu);
    this.updateAttribute('.theme-toggle', 'aria-label', t.navigation?.toggle_dark_mode);
    this.updateAttribute('.language-toggle', 'aria-label', 'Change language');

    // Hero section (index page only)
    const currentPage = this.getCurrentPage();
    if (currentPage === 'index') {
      this.updateText('.hero-greeting', t.hero?.greeting);
      this.updateText('.hero-name', t.hero?.name);
      this.updateText('.hero-description', t.hero?.description);
    }
    this.updateText('.hero__content p', t.hero?.welcome);
    this.updateText('.hero__cta a:first-child', t.hero?.cta_about);
    this.updateText('.hero__cta a:last-child', t.hero?.cta_blogs);

    // About section
    this.updateText('#about h2', t.about?.title);
    const aboutPs = document.querySelectorAll('#about p');
    if (aboutPs.length >= 4 && t.about) {
      aboutPs[0].textContent = t.about.intro;
      aboutPs[1].textContent = t.about.disclaimer;
      
      // Handle accounts paragraph with links
      if (aboutPs[2]) {
        const codebergLink = aboutPs[2].querySelector('a[href*="codeberg"]');
        const githubLink = aboutPs[2].querySelector('a[href*="github"]');
        if (codebergLink && githubLink) {
          aboutPs[2].innerHTML = `${t.about.accounts} <a href="${codebergLink.href}" target="_blank" rel="noopener">${t.about.codeberg_account}</a> ${t.about.accounts === 'My' ? 'and my' : 've'} <a href="${githubLink.href}" target="_blank" rel="noopener">${t.about.github_account}</a>`;
        }
      }
      
      // Handle hosting paragraph with link
      if (aboutPs[3]) {
        const githubPagesLink = aboutPs[3].querySelector('a[href*="github"]');
        if (githubPagesLink) {
          aboutPs[3].innerHTML = `${t.about.hosting_thanks} <a href="${githubPagesLink.href}" target="_blank" rel="noopener">${t.about.github_pages}</a> ${t.about.hosting_text}`;
        }
      }
    }

    // Blog page elements (blogs page only)
    if (currentPage === 'blogs') {
      this.updateText('h1 .accent-gradient', t.blog?.title);
    }
    this.updateText('#category-latest', t.blog?.current);
    this.updateText('#category-archived', t.blog?.archived);
    this.updateText('#prev-page', t.blog?.previous);
    this.updateText('#next-page', t.blog?.next);
    
    // Update page info text
    const pageInfo = document.getElementById('page-info');
    if (pageInfo && t.blog?.page) {
      const pageNum = pageInfo.textContent.match(/\d+/);
      if (pageNum) {
        pageInfo.textContent = `${t.blog.page} ${pageNum[0]}`;
      }
    }

    this.updateText('.loading', t.blog?.loading);
    this.updateText('#no-posts p', t.blog?.no_posts);

    // 404 page (404 page only)
    if (currentPage === '404') {
      const error404H1 = document.querySelector('h1');
      if (error404H1 && t.error_404 && error404H1.textContent.includes('404')) {
        const titleSpan = error404H1.querySelector('.accent-gradient');
        const subtitleSpan = error404H1.querySelector('span:last-child');
        if (titleSpan && subtitleSpan) {
          titleSpan.textContent = t.error_404.title;
          subtitleSpan.textContent = t.error_404.subtitle;
        }
      }
    }
    this.updateText('#cat-message', t.error_404?.cat_message);
    this.updateText('.btn[href*="index"]', t.error_404?.return_home);

    // Footer
    this.updateText('.copyright', t.footer?.made_with);
    this.updateAttribute('.to-top', 'aria-label', t.navigation?.back_to_top);

    // Disclaimer
    this.updateText('.disclaimer-footer p', t.disclaimer?.text);
    this.updateDisclaimerPopup(t);

    console.log(`Page translated to: ${this.currentLanguage}`);
  }

  showDisclaimerPopup() {
    if (localStorage.getItem('disclaimer-accepted')) return;
    if (document.getElementById('disclaimer-overlay')) return;

    const t = this.translations[this.currentLanguage];
    if (!t?.disclaimer_popup) return;

    const overlay = document.createElement('div');
    overlay.className = 'disclaimer-overlay';
    overlay.id = 'disclaimer-overlay';
    overlay.innerHTML = `
      <div class="disclaimer-popup" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
        <button class="disclaimer-close" aria-label="Close">&times;</button>
        <h2 class="disclaimer-title" id="disclaimer-title">${t.disclaimer_popup.title}</h2>
        <div class="disclaimer-content" id="disclaimer-text">${t.disclaimer_popup.text}</div>
        <div class="disclaimer-actions">
          <button class="disclaimer-accept" id="disclaimer-accept">${t.disclaimer_popup.accept}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    const closePopup = () => {
      overlay.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
      localStorage.setItem('disclaimer-accepted', 'true');
    };

    overlay.querySelector('.disclaimer-close').addEventListener('click', closePopup);
    overlay.querySelector('.disclaimer-accept').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });
  }

  updateDisclaimerPopup(t) {
    const overlay = document.getElementById('disclaimer-overlay');
    if (!overlay || !t?.disclaimer_popup) return;

    const title = overlay.querySelector('#disclaimer-title');
    const text = overlay.querySelector('#disclaimer-text');
    const accept = overlay.querySelector('#disclaimer-accept');

    if (title) title.textContent = t.disclaimer_popup.title;
    if (text) text.textContent = t.disclaimer_popup.text;
    if (accept) accept.textContent = t.disclaimer_popup.accept;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('blogs')) return 'blogs';
    if (path.includes('404')) return '404';
    return 'index';
  }

  updateText(selector, text) {
    if (!text) return;
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  updateAttribute(selector, attribute, value) {
    if (!value) return;
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute(attribute, value);
    }
  }
}

/* ===== Radio Music System ===== */
class RadioMusicSystem {
  constructor() {
    this.toggleButton = document.getElementById('radio-toggle');
    if (!this.toggleButton) return;

    this.music = new Audio('assets/lobbymusic.mp3');
    this.music.loop = true;
    this.music.volume = 0.45;

    this.clickSound = new Audio('assets/click.mp3');
    this.clickSound.volume = 0.7;

    this.shockSound = new Audio('assets/shock.mp3');
    this.shockSound.volume = 0.35;

    this.isLocked = false;
    this.isPlaying = false;
    this.clickCount = 0;
    this.clickWindowMs = 600;
    this.clickTimer = null;

    this.toggleButton.addEventListener('click', () => this.handleClick());
    this.tryAutoplay();
  }

  async tryAutoplay() {
    try {
      await this.music.play();
      this.isPlaying = true;
    } catch (error) {
      this.isPlaying = false;
    }
    this.updateUi();
  }

  handleClick() {
    if (this.isLocked) return;

    this.playSound(this.clickSound);
    this.clickCount += 1;

    if (this.clickCount === 1) {
      this.clickTimer = window.setTimeout(() => {
        this.clickTimer = null;
        this.handleToggle();
      }, this.clickWindowMs);
    }

    if (this.clickCount >= 3) {
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
      }
      this.triggerShock();
    }
  }

  async handleToggle() {
    if (this.clickCount >= 3 || this.isLocked) {
      this.resetClickState();
      return;
    }

    if (this.isPlaying) {
      this.music.pause();
      this.isPlaying = false;
    } else {
      try {
        await this.music.play();
        this.isPlaying = true;
      } catch (error) {
        this.isPlaying = false;
      }
    }

    this.updateUi();
    this.resetClickState();
  }

  triggerShock() {
    this.isLocked = true;
    this.music.pause();
    this.music.currentTime = 0;
    this.isPlaying = false;
    this.toggleButton.classList.remove('is-playing');
    this.toggleButton.classList.add('is-shocked');
    this.playSound(this.shockSound);
    this.resetClickState();
  }

  playSound(sound) {
    if (!sound) return;
    try {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (error) {
      // Ignore playback errors
    }
  }

  updateUi() {
    if (!this.toggleButton) return;
    this.toggleButton.classList.toggle('is-playing', this.isPlaying);
  }

  resetClickState() {
    this.clickCount = 0;
  }
}

// Initialize blog system and translation system
document.addEventListener('DOMContentLoaded', () => {
  new BlogSystem();
  new TranslationSystem();
  new RadioMusicSystem();
});
