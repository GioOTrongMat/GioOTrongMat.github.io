(() => {
  const stored = localStorage.getItem('portfolio-language');
  let language = stored === 'vi' ? 'vi' : 'en';
  document.documentElement.lang = language;

  const copy = {
    en: {
      nav: { works: 'My Works', projects: 'My Projects', about: 'About Me' },
      hero: { lines: ['FPV.', 'Cinematic.', 'Creator.'], subtitle: 'FPV Pilot · Filmmaker · Content Creator', works: 'My Works', about: 'About Me', scroll: 'Scroll' },
      about: {
        heading: 'About Me',
        bio: "I started out in graphic design, directly involved in building visual identities for major brands in the Vietnamese market such as Anker, UAG,... Over time, I realized that conveying messages through visuals alone wasn't enough to satisfy my creative needs and push my limits — so I made the shift into content production.\n\nOver more than 3 years on TikTok, I've had the opportunity to collaborate with brands of all sizes, including Sprite and Milo,… building up experience in storytelling, concept development, and connecting with audiences.\n\nRight now, I'm on a journey searching for inspiration — not just to keep making content, but to redefine the way I tell stories and create value in my creative work.",
        quote: 'Logic will get you from A to B.\nImagination will take you everywhere',
        tags: ['Graphic Design', 'Video Editor', 'Content Creator', 'FPV Cinematic Pilot']
      },
      works: { heading: 'My Works', cta: 'View All Works', fullHint: 'Click to watch the full video', previous: 'Previous work', next: 'Next work', open: 'open full video', status: ({ start, end, total }) => `Showing ${start}–${end} / ${total}` },
      projects: { heading: 'My Projects', previous: 'Previous project', next: 'Next project', play: 'Play video', goTo: 'Go to', unavailable: 'Video unavailable' },
      stats: ['Years of Experience', 'Brand Collaborations', 'Projects Completed'],
      contact: {
        label: 'Contact', title: ['Let\'s create', 'something together'],
        description: "Whether it's a small project or a big idea, I'm always ready to listen. Leave me a message and I'll get back to you within 24 hours.",
        firstName: 'First Name', lastName: 'Last Name', email: 'Email', message: 'Tell me about your project...', send: 'Send Message'
      },
      form: { sending: 'Sending...', sent: 'Sent ✓', thanks: "Thank you! I'll get back to you as soon as possible.", failed: 'Something went wrong. Please try again.', connection: 'Connection error. Please try again.' },
      ui: { unmute: 'Unmute', mute: 'Mute', switchLabel: 'Switch to Vietnamese' }
    },
    vi: {
      nav: { works: 'Tác phẩm', projects: 'Dự án', about: 'Về tôi' },
      hero: { lines: ['FPV.', 'Điện ảnh.', 'Sáng tạo.'], subtitle: 'Phi công FPV · Nhà làm phim · Nhà sáng tạo nội dung', works: 'Tác phẩm', about: 'Về tôi', scroll: 'Cuộn xuống' },
      about: {
        heading: 'Về tôi',
        bio: 'Tôi bắt đầu với thiết kế đồ họa và trực tiếp tham gia xây dựng nhận diện hình ảnh cho nhiều thương hiệu lớn tại thị trường Việt Nam như Anker, UAG,... Theo thời gian, tôi nhận ra hình ảnh tĩnh chưa đủ để thỏa mãn nhu cầu sáng tạo và thôi thúc mình bước xa hơn — vì vậy tôi chuyển sang sản xuất nội dung.\n\nTrong hơn 3 năm hoạt động trên TikTok, tôi có cơ hội hợp tác với nhiều thương hiệu ở các quy mô khác nhau, trong đó có Sprite và Milo,… Từ đó, tôi tích lũy kinh nghiệm về kể chuyện, phát triển ý tưởng và kết nối với khán giả.\n\nHiện tại, tôi đang trên hành trình tìm kiếm nguồn cảm hứng mới — để tiếp tục sáng tạo nội dung, đồng thời định hình lại cách mình kể chuyện và tạo ra giá trị trong công việc sáng tạo.',
        quote: 'Logic sẽ đưa bạn từ A đến B.\nTrí tưởng tượng sẽ đưa bạn đi khắp mọi nơi',
        tags: ['Thiết kế đồ họa', 'Biên tập video', 'Nhà sáng tạo nội dung', 'Phi công FPV điện ảnh']
      },
      works: { heading: 'Tác phẩm', cta: 'Xem tất cả tác phẩm', fullHint: 'Bấm vào để xem video đầy đủ', previous: 'Tác phẩm trước', next: 'Tác phẩm sau', open: 'mở video đầy đủ', status: ({ start, end, total }) => `Hiển thị ${start}–${end} / ${total}` },
      projects: { heading: 'Dự án', previous: 'Dự án trước', next: 'Dự án tiếp theo', play: 'Phát video', goTo: 'Đi tới', unavailable: 'Video chưa sẵn sàng' },
      stats: ['Năm kinh nghiệm', 'Thương hiệu hợp tác', 'Dự án đã thực hiện'],
      contact: {
        label: 'Liên hệ', title: ['Cùng nhau tạo nên', 'điều gì đó'],
        description: 'Dù là một dự án nhỏ hay một ý tưởng lớn, tôi luôn sẵn sàng lắng nghe. Hãy để lại lời nhắn và tôi sẽ phản hồi trong vòng 24 giờ.',
        firstName: 'Tên', lastName: 'Họ', email: 'Email', message: 'Hãy kể cho tôi về dự án của bạn...', send: 'Gửi tin nhắn'
      },
      form: { sending: 'Đang gửi...', sent: 'Đã gửi ✓', thanks: 'Cảm ơn bạn! Tôi sẽ phản hồi sớm nhất có thể.', failed: 'Đã xảy ra lỗi. Vui lòng thử lại.', connection: 'Lỗi kết nối. Vui lòng thử lại.' },
      ui: { unmute: 'Bật âm thanh', mute: 'Tắt âm thanh', switchLabel: 'Switch to English' }
    }
  };

  const get = (key, lang = language) => key.split('.').reduce((value, part) => value?.[part], copy[lang]);
  const localized = (value, lang = language) => typeof value === 'string' ? value : value && typeof value === 'object' ? value[lang] ?? value.en ?? value.vi ?? '' : '';
  const contentText = (value, fallback) => language === 'en' ? localized(value, 'en') || fallback : (value && typeof value === 'object' ? localized(value, 'vi') || fallback : fallback);
  const setText = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value ?? ''; };

  function applyLanguage(next) {
    language = next === 'vi' ? 'vi' : 'en';
    const text = copy[language];
    const data = window.portfolioContent || {};
    document.documentElement.lang = language;
    const switcher = document.querySelector('.language-switch');
    const toggle = document.querySelector('.language-toggle');
    if (switcher) switcher.dataset.lang = language;
    if (toggle) { toggle.setAttribute('aria-checked', String(language === 'vi')); toggle.setAttribute('aria-label', text.ui.switchLabel); }

    const nav = document.querySelectorAll('.nav-links a');
    [text.nav.works, text.nav.projects, text.nav.about].forEach((value, index) => { if (nav[index]) nav[index].textContent = value; });
    const heroLines = data.hero?.lines || [];
    document.querySelectorAll('.hero-title .line').forEach((element, index) => { element.textContent = contentText(heroLines[index]?.text, text.hero.lines[index] || ''); });
    setText('.hero-sub', contentText(data.hero?.subtitle, text.hero.subtitle));
    const heroButtons = document.querySelectorAll('.hero-ctas a');
    if (heroButtons[0]) heroButtons[0].textContent = text.hero.works;
    if (heroButtons[1]) heroButtons[1].textContent = text.hero.about;
    setText('.scroll-text', text.hero.scroll);

    setText('.instructor-eyebrow', contentText(data.about?.heading, text.about.heading));
    setText('.instructor-bio', contentText(data.about?.bio, text.about.bio));
    setText('.instructor-quote', contentText(data.about?.quote, text.about.quote));
    document.querySelectorAll('.instructor-tags .job-tag').forEach((element, index) => { element.textContent = contentText(data.about?.tags?.[index]?.text, text.about.tags[index] || ''); });
    document.querySelectorAll('.marquee-item').forEach((element, index) => { element.textContent = `✦ ${text.about.tags[index % text.about.tags.length]}`; });

    setText('#works .section-title', contentText(data.works?.heading, text.works.heading));
    setText('#works .section-cta', contentText(data.works?.cta, text.works.cta));
    setText('.works-full-hint', text.works.fullHint);
    const workNames = data.works?.items || [];
    document.querySelectorAll('.work-card').forEach((card, index) => { const name = localized(workNames[index]?.name, language); card.setAttribute('aria-label', `${name} — ${text.works.open}`); });
    document.querySelector('.works-prev')?.setAttribute('aria-label', text.works.previous);
    document.querySelector('.works-next')?.setAttribute('aria-label', text.works.next);

    setText('#process .section-title', contentText(data.projects?.heading, text.projects.heading));
    document.querySelector('#btnPrev')?.setAttribute('aria-label', text.projects.previous);
    document.querySelector('#btnNext')?.setAttribute('aria-label', text.projects.next);
    const projects = data.projects?.items || [];
    document.querySelectorAll('#sliderTrack .slide').forEach((slide, index) => { const name = localized(projects[index]?.name, language); slide.querySelector('.project-play')?.setAttribute('aria-label', `${text.projects.play} ${name}`); });
    document.querySelectorAll('#sliderDots .slider-dot').forEach((dot, index) => { const name = localized(projects[index]?.name, language) || `${index + 1}`; dot.setAttribute('aria-label', `${text.projects.goTo} ${name}`); });

    document.querySelectorAll('.stat-label').forEach((element, index) => { element.textContent = contentText(data.stats?.[index]?.label, text.stats[index]); });
    setText('#contact .section-num', text.contact.label);
    const title = document.querySelector('.contact-title');
    if (title) { const emphasis = document.createElement('em'); emphasis.textContent = text.contact.title[1]; title.replaceChildren(document.createTextNode(text.contact.title[0]), document.createElement('br'), emphasis); }
    setText('.contact-sub', contentText(data.contact?.description, text.contact.description));
    document.querySelector('[name="firstName"]')?.setAttribute('placeholder', text.contact.firstName);
    document.querySelector('[name="lastName"]')?.setAttribute('placeholder', text.contact.lastName);
    document.querySelector('[name="email"]')?.setAttribute('placeholder', text.contact.email);
    document.querySelector('[name="message"]')?.setAttribute('placeholder', text.contact.message);
    const submit = document.querySelector('#submitText');
    if (submit && !document.querySelector('#submitBtn')?.disabled) submit.textContent = text.contact.send;
    const mute = document.querySelector('#unmuteBtn');
    if (mute) mute.textContent = mute.dataset.muted === 'false' ? text.ui.mute : text.ui.unmute;
    window.dispatchEvent(new CustomEvent('portfolio-language-change', { detail: { language } }));
  }

  window.portfolioI18n = { get language() { return language; }, localized, t: (key, params) => { const value = get(key); return typeof value === 'function' ? value(params || {}) : value; }, applyLanguage };
  window.siteReady.then(() => {
    const toggle = document.querySelector('.language-toggle');
    toggle?.addEventListener('click', () => { const next = language === 'en' ? 'vi' : 'en'; localStorage.setItem('portfolio-language', next); applyLanguage(next); });
    applyLanguage(language);
  });
})();
