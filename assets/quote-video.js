(() => {
  const section = document.getElementById('ins-quote');
  const wrap = section?.querySelector('.quote-video-wrap');
  const sound = section?.querySelector('.quote-video-sound');
  if (!section || !wrap || !sound) return;

  let player = null;
  let ready = false;
  let inView = false;
  let audioUnlocked = false;
  let soundOn = false;
  let hover = false;
  let volumeFrame = 0;
  let volume = 0;
  let videoId = 'MrP9BZlo0WI';
  const youtubeId = value => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return '';
      const host = url.hostname.toLowerCase();
      const id = host === 'youtu.be' ? url.pathname.slice(1) :
        ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) ?
          url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : '';
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    } catch { return ''; }
  };
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)');
  const state = { get ready() { return ready; }, get inView() { return inView; }, get audioUnlocked() { return audioUnlocked; }, get soundOn() { return soundOn; }, get volume() { return volume; } };
  window.quoteVideoState = state;

  const setVolume = value => {
    volume = Math.max(0, Math.min(100, value));
    section.dataset.quoteVolume = String(Math.round(volume));
    if (ready) player.setVolume(Math.round(volume));
  };
  const fadeTo = target => {
    cancelAnimationFrame(volumeFrame);
    if (!ready) return;
    const start = volume;
    const begin = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - begin) / 550);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVolume(start + (target - start) * ease);
      if (progress < 1) volumeFrame = requestAnimationFrame(step);
    };
    volumeFrame = requestAnimationFrame(step);
  };
  const updateSound = () => {
    sound.dataset.muted = String(!soundOn);
    section.dataset.quoteAudioUnlocked = String(audioUnlocked);
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.setAttribute('aria-label', soundOn ? 'Tắt âm thanh video' : 'Bật âm thanh video');
  };
  const silence = () => {
    cancelAnimationFrame(volumeFrame);
    setVolume(0);
    if (ready) player.mute();
    soundOn = false;
    updateSound();
  };
  const startMuted = () => {
    if (!ready || !inView) return;
    silence();
    player.playVideo();
  };
  const enableSound = () => {
    if (!ready || !inView || !audioUnlocked) return;
    player.unMute();
    player.playVideo();
    soundOn = true;
    updateSound();
    fadeTo(hover && fineHover.matches && innerWidth > 767 ? 100 : 20);
    // Some browsers reject audible playback despite a previous interaction.
    setTimeout(() => {
      if (!ready || !inView || !soundOn) return;
      const playback = player.getPlayerState();
      const blocked = player.isMuted() || (playback !== YT.PlayerState.PLAYING && playback !== YT.PlayerState.BUFFERING);
      if (blocked) startMuted();
    }, 900);
  };

  sound.addEventListener('click', () => {
    audioUnlocked = true;
    section.dataset.quoteAudioUnlocked = 'true';
    if (soundOn) silence();
    else enableSound();
  });
  for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(type, event => {
      if (event.target.closest?.('.quote-video-sound')) return;
      if (audioUnlocked) return;
      audioUnlocked = true;
      section.dataset.quoteAudioUnlocked = 'true';
      if (inView) enableSound();
    }, { passive: true });
  }

  wrap.addEventListener('mouseenter', () => {
    hover = true;
    if (fineHover.matches && innerWidth > 767 && soundOn) fadeTo(100);
  });
  wrap.addEventListener('mouseleave', () => {
    hover = false;
    if (fineHover.matches && innerWidth > 767 && soundOn) fadeTo(20);
  });

  window.onQuoteYouTubeAPIReady = () => {
    if (player || !window.portfolioContent) return;
    player = new YT.Player('quoteYT', {
      videoId,
      // Match HeroYT's iframe options; viewport playback still starts through the API.
      playerVars: { autoplay: 0, mute: 1, loop: 1, playlist: videoId, controls: 0, showinfo: 0, rel: 0, modestbranding: 1, fs: 0, disablekb: 1, iv_load_policy: 3, playsinline: 1, enablejsapi: 1 },
      events: {
        onReady() {
          ready = true;
          section.dataset.quoteReady = 'true';
          silence();
          if (inView) audioUnlocked ? enableSound() : startMuted();
        },
        onStateChange(event) {
          section.dataset.quotePlayerState = String(event.data);
          if (!inView && event.data === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            silence();
          }
        },
        onError() { silence(); }
      }
    });
  };
  window.siteReady?.then(() => {
    videoId = youtubeId(window.portfolioContent?.quote?.youtube) || videoId;
    section.dataset.quoteVideoId = videoId;
    if (window.YT?.Player) window.onQuoteYouTubeAPIReady();
  });

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target !== section) continue;
      const visible = entry.isIntersecting && entry.intersectionRatio >= .25;
      if (visible === inView) continue;
      inView = visible;
      section.dataset.inView = String(visible);
      if (visible) {
        section.classList.add('reveal');
        if (ready) audioUnlocked ? enableSound() : startMuted();
      } else {
        section.classList.remove('reveal');
        cancelAnimationFrame(volumeFrame);
        if (ready) player.pauseVideo();
        silence();
      }
    }
  }, { threshold: [0, .25] });
  observer.observe(section);
  updateSound();
})();
