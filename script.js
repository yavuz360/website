// Progressive enhancement indicator + shared paths
const body = document.body;
body?.classList.remove('no-js');
const assetRoot = body?.dataset.assetRoot || 'assets/';
const translationsPath = body?.dataset.translations || './translations.json';
const entriesPath = body?.dataset.entries || './entries.txt';

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
  setThemeColorMeta(mode === 'dark' ? '#05070e' : '#fef8f1');
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

/* ===== Tree jingle + festive rain interaction ===== */
const treeContainer = document.querySelector('.hero__image');
const treeImage = treeContainer?.querySelector('img');
const ensureRainField = () => {
  let field = document.querySelector('.rain-field');
  if (!field) {
    field = document.createElement('div');
    field.className = 'rain-field';
    field.setAttribute('aria-hidden', 'true');
    document.body.appendChild(field);
  }
  return field;
};
const rainField = treeContainer ? ensureRainField() : document.querySelector('.rain-field');

const rainfallController = (() => {
  if (!rainField) return null;
  const assets = Array.from({ length: 6 }, (_, idx) => `${assetRoot}rain${idx + 1}.svg`);
  const timers = new Set();
  let slowInterval = null;
  let fastInterval = null;
  let activeDrops = 0;

  const clearTimer = (timer) => {
    if (!timer) return;
    clearTimeout(timer);
    clearInterval(timer);
  };

  const cleanupTimers = () => {
    timers.forEach((timer) => clearTimer(timer));
    timers.clear();
  };

  const removeDrop = (drop) => {
    drop.remove();
    activeDrops = Math.max(0, activeDrops - 1);
  };

  const createDrop = () => {
    if (!rainField || activeDrops >= 10) return;
    const drop = document.createElement('span');
    drop.className = 'rain-drop';
    drop.style.setProperty('--x', `${Math.random() * 100}%`);
    drop.style.setProperty('--duration', '5.5s');

    const img = document.createElement('img');
    img.src = assets[Math.floor(Math.random() * assets.length)];
    img.alt = '';
    drop.appendChild(img);

    activeDrops += 1;
    drop.addEventListener('animationend', () => removeDrop(drop), { once: true });
    rainField.appendChild(drop);
  };

  const stop = () => {
    if (slowInterval) {
      clearInterval(slowInterval);
      slowInterval = null;
    }
    if (fastInterval) {
      clearInterval(fastInterval);
      fastInterval = null;
    }
    cleanupTimers();
  };

  const start = (durationMs = 6000) => {
    if (!rainField) return;
    stop();

    createDrop();
    slowInterval = setInterval(createDrop, 900);
    const transition = setTimeout(() => {
      if (slowInterval) {
        clearInterval(slowInterval);
        slowInterval = null;
      }
      fastInterval = setInterval(createDrop, 350);
    }, 1800);
    timers.add(transition);

    const fadeOutDelay = Math.max(0, durationMs - 1200);
    const fadeTimer = setTimeout(() => {
      if (fastInterval) {
        clearInterval(fastInterval);
        fastInterval = null;
      }
      if (slowInterval) {
        clearInterval(slowInterval);
        slowInterval = null;
      }
    }, fadeOutDelay);
    timers.add(fadeTimer);
  };

  return { start, stop };
})();

if (treeContainer && treeImage) {
  const treeAudio = new Audio(`${assetRoot}jingle.mp3`);
  let treeIsPlaying = false;
  let cachedDuration = 0;

  treeAudio.addEventListener('loadedmetadata', () => {
    if (!Number.isNaN(treeAudio.duration)) {
      cachedDuration = treeAudio.duration * 1000;
    }
  });

  const resetTree = () => {
    treeImage.classList.remove('tree--jiggle');
    treeIsPlaying = false;
    rainfallController?.stop();
  };

  treeAudio.addEventListener('ended', resetTree);
  treeAudio.addEventListener('error', resetTree);

  const triggerTree = () => {
    if (treeIsPlaying) return;
    treeIsPlaying = true;
    treeImage.classList.add('tree--jiggle');
    treeAudio.currentTime = 0;
    const durationMs = cachedDuration || (treeAudio.duration ? treeAudio.duration * 1000 : 6500);
    rainfallController?.start(durationMs);
    const playPromise = treeAudio.play();
    if (playPromise instanceof Promise) {
      playPromise.catch(() => resetTree());
    }
  };

  treeContainer.addEventListener('click', triggerTree);
  treeContainer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerTree();
    }
  });
}

/* ===== Enlightenment Popup ===== */
const showEnlightenmentPopup = () => {
  const hasVisited = localStorage.getItem('enlightenment-accepted');
  if (hasVisited) return;

  // Create popup HTML
  const overlay = document.createElement('div');
  overlay.className = 'enlightenment-overlay';
  overlay.innerHTML = `
    <div class="enlightenment-popup">
      <button class="enlightenment-close" aria-label="Close">&times;</button>
      <h2 class="enlightenment-title">Enlightenment</h2>
      <div class="enlightenment-content">
        By visiting and browsing this website you accept that any information/tool/thought listed on this website is purely educational. No responsibility is taken.
      </div>
      <div class="enlightenment-actions">
        <button class="enlightenment-affirm">Affirm</button>
      </div>
    </div>
  `;

  body?.appendChild(overlay);

  // Show popup with animation
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // Setup close handlers
  const closePopup = () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
    }, 300);
    localStorage.setItem('enlightenment-accepted', 'true');
  };

  overlay.querySelector('.enlightenment-close').addEventListener('click', closePopup);
  overlay.querySelector('.enlightenment-affirm').addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });
};

// Show popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showEnlightenmentPopup);
} else {
  showEnlightenmentPopup();
}

/* ===== Blog System ===== */
class BlogSystem {
  constructor() {
    // Configuration - local file path
    this.entriesFile = entriesPath;
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

  body?.appendChild(overlay);

    // Show popup with animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Setup close handlers
    const closePopup = () => {
      overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
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
    this.currentLanguage = localStorage.getItem('website-language') || 'en';
    this.translations = {};
    this.languages = {
      'en': { flag: 'gb.png', name: 'English' },
      'tr': { flag: 'tr.png', name: 'Türkçe' },
      'de': { flag: 'de.png', name: 'Deutsch' }
    };
    
    this.init();
    window.translationSystem = this;
  }

  async init() {
    await this.loadTranslations();
    this.setupLanguageToggle();
    this.updateFlag();
    this.translatePage();
  }

  async loadTranslations() {
    try {
      const response = await fetch(translationsPath);
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
    
    this.currentLanguage = languages[nextIndex];
    localStorage.setItem('website-language', this.currentLanguage);
    
    this.updateFlag();
    this.translatePage();
  }

  updateFlag() {
    const flagIcon = document.getElementById('current-flag');
    if (flagIcon && this.languages[this.currentLanguage]) {
      const lang = this.languages[this.currentLanguage];
      flagIcon.src = `${assetRoot}${lang.flag}`;
      flagIcon.alt = lang.name;
    }
  }

  getSection(section) {
    return this.translations[this.currentLanguage]?.[section];
  }

  translatePage() {
    if (!this.translations[this.currentLanguage]) {
      console.warn(`No translations found for language: ${this.currentLanguage}`);
      return;
    }

    const t = this.translations[this.currentLanguage];
    
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
    this.updateText('nav a[href*="contact"]', t.navigation?.contact);
    this.updateText('nav a[href*="blogs"]', t.navigation?.blogs);
    this.updateAttribute('.nav__toggle .visually-hidden', 'textContent', t.navigation?.toggle_menu);
    this.updateAttribute('.theme-toggle', 'aria-label', t.navigation?.toggle_dark_mode);
    this.updateAttribute('.language-toggle', 'aria-label', 'Change language');

    // Hero section (index page only)
    const currentPage = this.getCurrentPage();
    if (currentPage === 'index') {
      const heroH1 = document.querySelector('.hero h1');
      if (heroH1 && t.hero) {
        const nameSpan = heroH1.querySelector('.accent-gradient');
        if (nameSpan) {
          heroH1.innerHTML = `${t.hero.greeting || 'Hi, I\'m'} <span class="accent-gradient">${t.hero.name || 'Yavuz'}</span> ${t.hero.description || '— a gray hat who always has an eye on vulnerabilities.'}`;
        }
      }
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

    // Contact section
    this.updateText('#contact h2', t.contact?.title);
    const contactP = document.querySelector('#contact p');
    if (contactP && t.contact) {
      const emailLink = contactP.querySelector('a[href^="mailto:"]');
      if (emailLink) {
        contactP.innerHTML = `${t.contact.message} <a href="${emailLink.href}">${emailLink.textContent}</a>${t.contact.follow_up}`;
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

    console.log(`Page translated to: ${this.currentLanguage}`);
    document.dispatchEvent(new CustomEvent('site-language-change', {
      detail: { language: this.currentLanguage }
    }));
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

/* ===== New Year Countdown ===== */
class NewYearCountdown {
  constructor() {
    this.container = document.getElementById('countdown-wrapper');
    if (!this.container) return;
    this.valueEl = document.getElementById('countdown-value');
    this.preEl = document.getElementById('countdown-pretext');
    this.postEl = document.getElementById('countdown-posttext');
    this.targetMs = Number(body?.dataset.newyearTarget) || null;
    this.startMs = Number(body?.dataset.newyearStart) || null;
    this.placeholder = '30d 23h 59m 59s';
    this.state = 'inactive';
    this.interval = null;
    this.init();
  }

  init() {
    this.applyTexts();
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
    document.addEventListener('site-language-change', () => this.applyTexts());
  }

  getStrings() {
    const defaults = {
      pre: '',
      post: 'Until 2026',
      celebration: 'We made it to 2026 🥳'
    };
    const translation = window.translationSystem?.getSection?.('newyear');
    return { ...defaults, ...(translation || {}) };
  }

  applyTexts() {
    if (!this.preEl || !this.postEl) return;
    const strings = this.getStrings();
    if (this.state === 'done') {
      this.preEl.textContent = strings.celebration;
      this.postEl.textContent = '';
    } else {
      this.preEl.textContent = strings.pre;
      this.postEl.textContent = strings.post;
    }
  }

  formatDiff(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  tick() {
    if (!this.valueEl || !this.targetMs) return;
    const now = Date.now();
    if (this.startMs && now < this.startMs) {
      this.state = 'inactive';
      this.valueEl.textContent = this.placeholder;
      this.container.classList.add('countdown--inactive');
      this.container.classList.remove('countdown--celebration');
      this.applyTexts();
      return;
    }

    const diff = Math.max(0, this.targetMs - now);
    this.valueEl.textContent = this.formatDiff(diff);
    this.container.classList.remove('countdown--inactive');

    if (diff === 0) {
      this.state = 'done';
      this.container.classList.add('countdown--celebration');
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    } else {
      this.state = 'running';
      this.container.classList.remove('countdown--celebration');
    }

    this.applyTexts();
  }
}

// Initialize app systems
document.addEventListener('DOMContentLoaded', () => {
  new TranslationSystem();
  new BlogSystem();
  new NewYearCountdown();
});
