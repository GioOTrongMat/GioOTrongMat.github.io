/* Content is applied before the existing animation/event code starts. */
window.siteReady = (async () => {
  const $ = (s) => document.querySelector(s);
  const text = (s, value) => { const el = $(s); if (el) el.textContent = value ?? ''; };
  const url = (value, fallback = '') => {
    if (!value) return fallback;
    try { const u = new URL(value, location.href); return ['https:', 'http:'].includes(u.protocol) ? u.href : fallback; } catch { return fallback; }
  };
  const embed = (value, hero = false) => {
    try {
      const u = new URL(value);
      let id;
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
      if (['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)) id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}` + (hero ? `?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&enablejsapi=1` : '');
      if (!hero && u.hostname === 'drive.google.com') {
        id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || u.searchParams.get('id');
        if (id && /^[\w-]+$/.test(id)) return `https://drive.google.com/file/d/${id}/preview`;
      }
    } catch {}
    return '';
  };
  const mp4 = value => {
    if (!value) return '';
    try {
      const u = new URL(value, location.href);
      const localUpload = value.startsWith('/uploads/') && u.origin === location.origin;
      const remoteFile = u.protocol === 'https:';
      return (localUpload || remoteFile) && /\.mp4$/i.test(u.pathname) ? u.href : '';
    } catch { return ''; }
  };
  const workCard = work => {
    const href = url(work.link);
    const card = document.createElement('a');
    card.className = 'work-card';
    card.href = href || '#works';
    card.setAttribute('aria-label', work.name);
    if (href) { card.target = '_blank'; card.rel = 'noopener noreferrer'; }
    else card.setAttribute('aria-disabled', 'true');

    const placeholder = document.createElement('div');
    placeholder.className = 'work-card-placeholder';
    placeholder.textContent = work.name;
    card.append(placeholder);

    const thumbnail = url(work.image);
    if (thumbnail) {
      const image = document.createElement('img');
      image.className = 'work-card-cover';
      image.src = thumbnail;
      image.alt = work.name;
      image.loading = 'lazy';
      card.append(image);
    } else card.classList.add('missing-thumbnail');

    const videoSource = mp4(work.video);
    if (videoSource) {
      const video = document.createElement('video');
      video.className = 'work-card-video';
      video.src = videoSource;
      video.preload = 'metadata';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      card.classList.add('has-video');
      card.append(video);
    }

    const overlay = document.createElement('div');
    overlay.className = 'work-card-overlay';
    const info = document.createElement('div');
    info.className = 'work-card-info';
    const name = document.createElement('p');
    name.className = 'work-name';
    name.textContent = work.name;
    info.append(name);
    card.append(overlay, info);
    if (href) { const icon = document.createElement('span'); icon.className = 'work-card-link-icon'; card.append(icon); }
    return card;
  };
  const response = await fetch('content/site.json', {cache:'no-cache',signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error(`Content: ${response.status}`);
  const d = await response.json();
  for (const key of ['hero','about','works','projects','stats','contact','layout']) if (!d[key]) throw new Error(`Missing ${key}`);
  for (const [obj,key] of [[d.hero,'lines'],[d.about,'tags'],[d.works,'items'],[d.projects,'items'],[d.layout,'sections']]) if (!Array.isArray(obj[key])) obj[key]=[];
  if (!Array.isArray(d.stats)) d.stats=[];
  document.title = d.title;
  $('.nav-logo img').src = url(d.logo);
  text('.hero-label',d.hero.label); text('.hero-sub',d.hero.subtitle);
  $('.hero-title').replaceChildren(...d.hero.lines.map(line=>{const span=document.createElement('span');span.className='line';span.textContent=line.text;return span;}));
  const heroURL=embed(d.hero.youtube,true); if(heroURL) $('#heroYT').src=heroURL;
  text('.instructor-eyebrow',d.about.heading);text('.instructor-name',d.about.name);
  $('#ins-img img').src=url(d.about.image); $('#ins-img img').alt=d.about.name;
  text('.instructor-bio',d.about.bio);text('.instructor-quote',d.about.quote);text('.instructor-quote-wrap p:last-child','— '+d.about.author+' —');
  $('.instructor-tags').replaceChildren(...d.about.tags.map(tag=>{const el=document.createElement('span');el.className='job-tag';el.textContent=tag.text;return el;}));
  $('.marquee-track').replaceChildren(...Array.from({length:6},()=>d.about.tags.map(tag=>{const el=document.createElement('span');el.className='marquee-item';el.textContent='✦ '+tag.text;return el;})).flat());
  text('#works .section-title',d.works.heading); text('#works .section-cta',d.works.cta);
  text('nav a[href="#works"]',d.works.heading);text('.hero-btn-primary',d.works.heading);
  text('nav a[href="#instructor"]',d.about.heading);text('.hero-btn-secondary',d.about.heading);
  text('nav a[href="#process"]',d.projects.heading);
  $('.works-grid').replaceChildren(...d.works.items.map(workCard));
  text('#process .section-title',d.projects.heading);
  $('#sliderTrack').replaceChildren(...d.projects.items.map((project,i)=>{
    const slide=document.createElement('div');slide.className='slide'+(i===0?' active':'');slide.dataset.index=i;slide.dataset.ratio=project.ratio;
    const src=embed(project.url);
    if(src){const frame=document.createElement('iframe');frame.src=src;frame.title=project.name;frame.allow='autoplay; encrypted-media; fullscreen';frame.allowFullscreen=true;frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:none;';slide.append(frame);}
    else {const p=document.createElement('p');p.textContent='Video chưa có link hợp lệ';slide.append(p);}
    return slide;
  }));
  $('#sliderDots').replaceChildren(...d.projects.items.map((p,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='slider-dot'+(i===0?' active':'');dot.dataset.dot=i;dot.setAttribute('aria-label',p.name);return dot;}));
  for(const s of ['#btnPrev','#btnNext']) $(s).hidden=d.projects.items.length<2;
  window.siteStats={};
  $('.stats-grid').replaceChildren(...d.stats.map((stat,i)=>{const item=document.createElement('div');item.className='stat-item';const num=document.createElement('div');num.className='stat-num';const span=document.createElement('span');span.id='n'+(i+1);span.textContent='0';window.siteStats[span.id]=Math.max(0,Math.min(1000000,Number(stat.value)||0));num.append(span,'+');const label=document.createElement('div');label.className='stat-label';label.textContent=stat.label;item.append(num,label);return item;}));
  const heading=d.contact.heading.split('\n');$('.contact-title').replaceChildren();heading.forEach((line,i)=>{if(i) $('.contact-title').append(document.createElement('br'));const el=document.createElement(i?'em':'span');el.textContent=line;$('.contact-title').append(el);});
  text('.contact-sub',d.contact.description);text('.contact-email',d.contact.email);$('.contact-email').href='mailto:'+d.contact.email;
  const ids=['hero','instructor','works','stats','process','contact'];const seen=new Set();
  const anchor=document.createComment('Content sections');document.body.insertBefore(anchor,$('#hero'));
  for(const section of [...d.layout.sections,...ids.map(id=>({id,visible:true}))]){
    if(!ids.includes(section.id)||seen.has(section.id))continue;seen.add(section.id);
    const el=document.getElementById(section.id);el.hidden=section.visible===false;anchor.before(el);
    if(section.id==='hero'){const marquee=$('.marquee-wrap');marquee.hidden=el.hidden;anchor.before(marquee);}
    document.querySelectorAll(`a[href="#${section.id}"]`).forEach(a=>a.hidden=el.hidden);
  }
  anchor.remove();
  document.body.dataset.workColumns=['1','2','3'].includes(String(d.layout.columns))?d.layout.columns:'3';
  document.body.dataset.aboutImage=d.layout.aboutImage==='right'?'right':'left';
  for(const [key,name] of [['accent','--gold'],['background','--ink']]) if(/^#[0-9a-f]{6}$/i.test(d.layout[key]))document.documentElement.style.setProperty(name,d.layout[key]);
})().catch(error => { console.error('Không tải được nội dung quản trị:',error); });
