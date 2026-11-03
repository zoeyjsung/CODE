/**
 * Letters to the Sea - Interactive Logic & Canvas Ocean
 * Features:
 * - Dynamic sparkling ocean background with gentle wave motion
 * - Ambient Web Audio wave generator (synthetic shore sounds without external audio dependency)
 * - Tactile letter folding and smooth 3D drift release animation
 * - Peaceful confirmation and keepsake snapshot generator
 */

(function () {
  // --- DOM Elements ---
  const oceanCanvas = document.getElementById('oceanCanvas');
  const recipientInput = document.getElementById('recipientInput');
  const messageInput = document.getElementById('messageInput');
  const senderInput = document.getElementById('senderInput');
  const signoffPrefix = document.getElementById('signoffPrefix');
  const charCount = document.getElementById('charCount');
  const sendToSeaBtn = document.getElementById('sendToSeaBtn');
  const writingDesk = document.getElementById('writingDesk');
  const seaEnvelope = document.getElementById('seaEnvelope');
  const confirmationDesk = document.getElementById('confirmationDesk');
  const writeAnotherBtn = document.getElementById('writeAnotherBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundLabel = document.getElementById('soundLabel');
  const iconMuted = soundToggleBtn.querySelector('.icon-muted');
  const iconWaves = soundToggleBtn.querySelector('.icon-waves');
  const currentDateStamp = document.getElementById('currentDateStamp');

  // Keepsake Modal Elements
  const saveKeepsakeBtn = document.getElementById('saveKeepsakeBtn');
  const keepsakeModal = document.getElementById('keepsakeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  const keepsakeRenderArea = document.getElementById('keepsakeRenderArea');
  const ksToText = document.getElementById('ksToText');
  const ksMessageText = document.getElementById('ksMessageText');
  const ksSignoffText = document.getElementById('ksSignoffText');
  const ksDateText = document.getElementById('ksDateText');

  // State
  let lastLetterData = {
    to: '',
    message: '',
    signoff: '',
    sender: '',
    date: ''
  };

  // --- Dynamic Date Setup ---
  function updatePostmarkDate() {
    const now = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[now.getMonth()];
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const formatted = `${month} ${day} ${year}`;
    if (currentDateStamp) currentDateStamp.textContent = formatted;
    return formatted;
  }
  const formattedToday = updatePostmarkDate();

  // --- Word Counter & Dynamic Textarea Height ---
  messageInput.addEventListener('input', () => {
    const text = messageInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    charCount.textContent = words;

    // Auto-grow
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.max(220, messageInput.scrollHeight) + 'px';
  });

  // --- Ocean Wave & Sparkle Canvas (Inspired by Inspo 0) ---
  const ctx = oceanCanvas.getContext('2d');
  let width, height;
  let sparkles = [];
  let waveTime = 0;

  function resizeCanvas() {
    width = oceanCanvas.width = window.innerWidth;
    height = oceanCanvas.height = window.innerHeight;
    initSparkles();
  }

  function initSparkles() {
    sparkles = [];
    // Number of glistening light spots on the water
    const sparkleCount = Math.floor((width * height) / 9000);
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseSize: Math.random() * 2.8 + 0.8,
        speed: Math.random() * 0.04 + 0.02,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.2 + 0.05
      });
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawOcean() {
    waveTime += 0.016;

    // Soft atmospheric ocean gradient (calming dusty coastal blue)
    const seaGradient = ctx.createLinearGradient(0, 0, 0, height);
    seaGradient.addColorStop(0, '#bed4de');
    seaGradient.addColorStop(0.3, '#9cbccd');
    seaGradient.addColorStop(0.65, '#6b92a6');
    seaGradient.addColorStop(1, '#3b6277');
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, 0, width, height);

    // Glittering sunlight sparkles (bokeh diamonds on water)
    sparkles.forEach((s) => {
      s.phase += s.speed;
      s.x += s.driftSpeed * 0.2;
      if (s.x > width) s.x = 0;

      const alpha = (Math.sin(s.phase) + 1) / 2;
      if (alpha > 0.1) {
        ctx.save();
        ctx.translate(s.x, s.y + Math.sin(waveTime + s.x * 0.01) * 3);
        ctx.fillStyle = `rgba(255, 253, 240, ${alpha * 0.85})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 8;

        // Diamond/cross sparkle shape
        const currentSize = s.baseSize * (0.8 + alpha * 0.8);
        ctx.beginPath();
        ctx.moveTo(0, -currentSize * 2.2);
        ctx.lineTo(currentSize * 0.7, 0);
        ctx.lineTo(0, currentSize * 2.2);
        ctx.lineTo(-currentSize * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    requestAnimationFrame(drawOcean);
  }

  requestAnimationFrame(drawOcean);

  // --- Audio Engine (Mermaid Grotto Ocean Ambience) ---
  const ambientMusicPlayer = document.getElementById('ambientMusicPlayer');
  let isPlaying = false;

  ambientMusicPlayer.volume = 0.5;

  soundToggleBtn.addEventListener('click', () => {
    if (isPlaying) {
      ambientMusicPlayer.pause();
      isPlaying = false;
      soundLabel.textContent = 'play music';
      iconMuted.classList.remove('hidden');
      iconWaves.classList.add('hidden');
    } else {
      ambientMusicPlayer.play().then(() => {
        isPlaying = true;
        soundLabel.textContent = 'pause music';
        iconMuted.classList.add('hidden');
        iconWaves.classList.remove('hidden');
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  });

  // --- The Release Ritual (Interactive Sending Flow) ---
  sendToSeaBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (!message) {
      // Soft gentle shake if empty
      writingDesk.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0px)' }
      ], { duration: 320 });
      messageInput.focus();
      return;
    }

    // Cache the letter data for keepsake
    lastLetterData = {
      to: recipientInput.value.trim() || 'The Endless Sea',
      message: message,
      signoff: signoffPrefix.value || '',
      sender: senderInput.value.trim() || 'Anonymous',
      date: formattedToday
    };

    // 1. Fold out writing desk
    writingDesk.classList.add('folding-out');

    // 2. Reveal and fold envelope
    setTimeout(() => {
      writingDesk.classList.add('hidden');
      seaEnvelope.classList.remove('hidden');

      const envelopeFlap = seaEnvelope.querySelector('.envelope-flap');
      const envelopeSeal = seaEnvelope.querySelector('.envelope-wax-seal');

      // Flap folds closed
      setTimeout(() => {
        envelopeFlap.classList.add('closed');
      }, 350);

      // Seal stamps on
      setTimeout(() => {
        envelopeSeal.classList.add('sealed');
      }, 1000);

      // Drifting out onto the sea water
      setTimeout(() => {
        seaEnvelope.classList.add('animate-drift');
      }, 1500);

      // Complete transition to confirmation
      setTimeout(() => {
        seaEnvelope.classList.add('hidden');
        confirmationDesk.classList.remove('hidden');
      }, 6200);

    }, 600);
  });

  // --- Write Another Letter Action ---
  writeAnotherBtn.addEventListener('click', () => {
    // Reset forms
    recipientInput.value = '';
    messageInput.value = '';
    senderInput.value = '';
    charCount.textContent = '0';
    messageInput.style.height = 'auto';

    // Reset envelope classes
    seaEnvelope.className = 'drifting-envelope hidden';
    const envelopeFlap = seaEnvelope.querySelector('.envelope-flap');
    const envelopeSeal = seaEnvelope.querySelector('.envelope-wax-seal');
    envelopeFlap.classList.remove('closed');
    envelopeSeal.classList.remove('sealed');

    // Show writing desk
    confirmationDesk.classList.add('hidden');
    writingDesk.classList.remove('hidden', 'folding-out');
  });

  // --- Keepsake Modal & Download ---
  saveKeepsakeBtn.addEventListener('click', () => {
    ksToText.textContent = `To: ${lastLetterData.to}`;
    ksMessageText.textContent = lastLetterData.message;
    ksSignoffText.textContent = `${lastLetterData.signoff} ${lastLetterData.sender}`;
    ksDateText.textContent = lastLetterData.date;
    keepsakeModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    keepsakeModal.classList.add('hidden');
  });

  keepsakeModal.addEventListener('click', (e) => {
    if (e.target === keepsakeModal) {
      keepsakeModal.classList.add('hidden');
    }
  });

  downloadImageBtn.addEventListener('click', () => {
    if (typeof html2canvas !== 'undefined') {
      downloadImageBtn.textContent = 'Creating keepsake...';
      html2canvas(keepsakeRenderArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fbf9f4'
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Letter-Out-To-Sea-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        downloadImageBtn.textContent = 'Downloaded!';
        setTimeout(() => {
          downloadImageBtn.textContent = 'Download Postcard (.png)';
        }, 2200);
      }).catch(err => {
        console.error('Keepsake capture error:', err);
        downloadImageBtn.textContent = 'Download failed';
      });
    }
  });

})();
