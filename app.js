document.addEventListener('DOMContentLoaded', () => {
  const BASE_PRICE = 30000;
  const BASE_WEEKS = 2;

  const checkboxes = document.querySelectorAll('.module-checkbox');
  const totalPriceEl = document.getElementById('total-price');
  const totalTimeEl = document.getElementById('total-time');
  const modulesCountEl = document.getElementById('modules-count');
  const itemsListEl = document.getElementById('items-list');
  const btnCopy = document.getElementById('btn-copy');
  const orderForm = document.getElementById('order-form');
  const btnSubmit = document.getElementById('btn-submit');
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');

  function formatMoney(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function calculateState() {
    let currentPrice = BASE_PRICE;
    let extraWeeks = 0;
    let selectedAddons = [];

    checkboxes.forEach((cb) => {
      const card = cb.closest('.card-addon');
      if (cb.checked) {
        card.classList.add('selected');
        const price = parseInt(cb.dataset.price, 10);
        const weeks = parseFloat(cb.dataset.weeks);
        const name = cb.dataset.name;

        currentPrice += price;
        extraWeeks += weeks;
        selectedAddons.push({ name, price });
      } else {
        card.classList.remove('selected');
      }
    });

    totalPriceEl.textContent = formatMoney(currentPrice);

    const minWeeks = Math.round(BASE_WEEKS + extraWeeks * 0.7);
    const maxWeeks = Math.round(BASE_WEEKS + extraWeeks + 1);
    if (selectedAddons.length === 0) {
      totalTimeEl.textContent = '2 až 3 týdny';
    } else {
      totalTimeEl.textContent = `${minWeeks} až ${maxWeeks} týdnů`;
    }

    const totalCount = 1 + selectedAddons.length;
    modulesCountEl.textContent = `${totalCount} ${totalCount === 1 ? 'položka' : (totalCount < 5 ? 'položky' : 'položek')}`;

    itemsListEl.innerHTML = '';
    
    const baseItemDiv = document.createElement('div');
    baseItemDiv.className = 'summary-item';
    baseItemDiv.innerHTML = `
      <span class="item-name">CORE Identity (Základ)</span>
      <span class="item-price">30 000 Kč</span>
    `;
    itemsListEl.appendChild(baseItemDiv);

    selectedAddons.forEach((addon) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'summary-item';
      itemDiv.innerHTML = `
        <span class="item-name">${addon.name}</span>
        <span class="item-price">+${formatMoney(addon.price)} Kč</span>
      `;
      itemsListEl.appendChild(itemDiv);
    });

    return {
      price: currentPrice,
      timeline: totalTimeEl.textContent,
      addons: selectedAddons
    };
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener('change', calculateState);
  });

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const state = calculateState();
      
      let text = `SPECIFIKACE SPOLUPRÁCE (CORE FRAMEWORK)\n`;
      text += `=========================================\n\n`;
      text += `1. ZÁKLAD: CORE Identity (30 000 Kč)\n`;
      text += `   * Kompletní DNA session a profil klíčového zákazníka\n`;
      text += `   * Vizuální audit a vymezení vůči konkurenci\n`;
      text += `   * 2 kreativní směry, stavba loga, barev a typografie\n`;
      text += `   * Brand manuál a strategie v PDF\n\n`;

      if (state.addons.length > 0) {
        text += `2. VYBRANÉ ROZŠIŘUJÍCÍ MODULY:\n`;
        state.addons.forEach((addon) => {
          text += `   + ${addon.name} (${formatMoney(addon.price)} Kč)\n`;
        });
        text += `\n`;
      }

      text += `=========================================\n`;
      text += `ODHADOVANÁ INVESTICE: ${formatMoney(state.price)} Kč (bez DPH)\n`;
      text += `ODHADOVANÝ ČAS DODÁNÍ: ${state.timeline}\n`;

      navigator.clipboard.writeText(text).then(() => {
        const originalText = btnCopy.innerHTML;
        btnCopy.style.background = '#1E0F91';
        btnCopy.style.color = '#ffffff';
        btnCopy.textContent = 'Specifikace zkopírována do schránky';
        
        setTimeout(() => {
          btnCopy.style.background = '';
          btnCopy.style.color = '';
          btnCopy.innerHTML = originalText;
        }, 2500);
      });
    });
  }

  // ========================================================
  // FORMSPREE INTEGRACE PRO EMAIL KRYSTOF.CREATIVE@GMAIL.COM
  // ========================================================
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('client-name').value;
      const company = document.getElementById('client-company').value;
      const email = document.getElementById('client-email').value;
      const note = document.getElementById('client-note').value;
      const state = calculateState();

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Odesílám poptávku...';
      }

      const addonsText = state.addons.length > 0 
        ? state.addons.map(a => `${a.name} (+${formatMoney(a.price)} Kč)`).join(', ')
        : 'Pouze základní CORE Identity';

      const payload = {
        "Jméno a příjmení": name,
        "Firma": company,
        "Email klienta": email,
        "Poznámka / dotaz": note || 'Bez poznámky',
        "Vybraná konfigurace": addonsText,
        "Celková investice": `${formatMoney(state.price)} Kč bez DPH`,
        "Doba realizace": state.timeline
      };

      try {
        const response = await fetch('https://formspree.io/f/mrpbjldz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const formWrapper = document.getElementById('inquiry-form-wrapper');
          const successCard = document.getElementById('success-card');
          const btnCalBooking = document.getElementById('btn-cal-booking');

          // Dynamické sestavení Cal.com odkazu s předvyplněným jménem, e-mailem a konfigurací
          const calBaseUrl = 'https://cal.com/krystof-regent-rd1jzd/core-discovery';
          try {
            const calUrl = new URL(calBaseUrl);
            if (name) calUrl.searchParams.set('name', name);
            if (email) calUrl.searchParams.set('email', email);
            const calNotes = `Firma: ${company || 'neuvedeno'} | Konfigurace: ${addonsText}${note ? ' | Poznámka: ' + note : ''}`;
            calUrl.searchParams.set('notes', calNotes);

            if (btnCalBooking) {
              btnCalBooking.href = calUrl.toString();
            }
          } catch (e) {
            console.error('Chyba sestavení Cal.com URL:', e);
          }

          if (formWrapper) formWrapper.style.display = 'none';
          if (successCard) successCard.style.display = 'block';
          if (errorMsg) errorMsg.style.display = 'none';
          orderForm.reset();
        } else {
          if (errorMsg) errorMsg.style.display = 'block';
        }
      } catch (err) {
        console.error('Chyba odeslání přes Formspree:', err);
        if (errorMsg) errorMsg.style.display = 'block';
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Odeslat nezávaznou poptávku';
        }
      }
    });
  }

  calculateState();

  // ========================================================
  // SUBTILNÍ 3D MONOLIT REGENT JAKO JEMNÝ VODOZNAK
  // ========================================================
  const regentWrap = document.querySelector('.cube-3d-wrap');

  if (regentWrap) {
    regentWrap.innerHTML = '';

    const totalLayers = 24;
    const layerStep = 2.6;
    const half = Math.floor(totalLayers / 2);

    for (let i = 0; i < totalLayers; i++) {
      const layer = document.createElement('div');
      layer.textContent = 'REGENT';
      layer.className = 'regent-layer';

      const zPos = (i - half) * layerStep;
      layer.style.transform = `translateZ(${zPos}px)`;

      if (i === totalLayers - 1) {
        layer.classList.add('layer-front');
      } else if (i === 0) {
        layer.classList.add('layer-back');
      } else {
        layer.classList.add('layer-side');
      }

      regentWrap.appendChild(layer);
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let targetTransX = 0;
    let targetTransY = 0;

    let currentRotX = 0;
    let currentRotY = 0;
    let currentTransX = 0;
    let currentTransY = 0;

    let targetScrollScale = 1.0;
    let currentScrollScale = 1.0;
    let targetScrollY = 0;
    let currentScrollY = 0;

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;

      targetRotY = normX * 24;
      targetRotX = -normY * 16;
      targetTransX = normX * 30;
      targetTransY = normY * 18;
    });

    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
      
      targetScrollScale = 1.0 + progress * 0.10;
      targetScrollY = progress * -30;
    }, { passive: true });

    function animate3D() {
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentTransX += (targetTransX - currentTransX) * 0.05;
      currentTransY += (targetTransY - currentTransY) * 0.05;

      currentScrollScale += (targetScrollScale - currentScrollScale) * 0.05;
      currentScrollY += (targetScrollY - currentScrollY) * 0.05;

      const isMobile = window.innerWidth <= 960;
      const baseScaleX = isMobile ? 0.65 : 1.22;
      const baseScaleY = isMobile ? 0.52 : 0.95;

      const finalScaleX = baseScaleX * currentScrollScale;
      const finalScaleY = baseScaleY * currentScrollScale;
      const totalTransY = currentTransY + currentScrollY;

      regentWrap.style.transform = `translate3d(${currentTransX}px, ${totalTransY}px, 0) scaleX(${finalScaleX}) scaleY(${finalScaleY}) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
      requestAnimationFrame(animate3D);
    }

    animate3D();
  }

  // ========================================================
  // JEMNÝ A SMOOTH SQUISH LOGA V PATIČCE & GRAVITAČNÍ EMOJI
  // ========================================================
  const footerLogoRow = document.querySelector('.footer-logo-row');
  const footerLogoImg = document.getElementById('f-logo');
  const emojiList = ['🚀', '💎', '🔥', '⚡️', '👾', '🎯', '👑', '💸', '🎨', '👁️', '🪄', '💣', '🧸', '🍕', '🏆', '✨', '💿', '🕹️'];
  let activeParticles = [];
  let physicsRunning = false;
  let isSquishing = false;

  let emojiContainer = document.getElementById('emoji-physics-container');
  if (!emojiContainer) {
    emojiContainer = document.createElement('div');
    emojiContainer.id = 'emoji-physics-container';
    document.body.appendChild(emojiContainer);
  }

  function triggerSmoothSquish() {
    if (!footerLogoImg || isSquishing) return;
    isSquishing = true;

    footerLogoImg.classList.remove('is-rebounded');
    footerLogoImg.classList.add('is-squished');

    setTimeout(() => {
      footerLogoImg.classList.remove('is-squished');
      footerLogoImg.classList.add('is-rebounded');
      setTimeout(() => {
        footerLogoImg.classList.remove('is-rebounded');
        isSquishing = false;
      }, 200);
    }, 180);

    const rect = footerLogoImg.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top;

    const count = Math.floor(Math.random() * 2) + 1;
    for (let c = 0; c < count; c++) {
      const emojiChar = emojiList[Math.floor(Math.random() * emojiList.length)];
      const el = document.createElement('div');
      el.className = 'falling-emoji';
      el.textContent = emojiChar;
      emojiContainer.appendChild(el);

      const particle = {
        el: el,
        x: startX - 16,
        y: startY,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 8 + 8),
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 14,
        bounces: 0,
        opacity: 1
      };

      activeParticles.push(particle);
    }

    if (!physicsRunning) {
      physicsRunning = true;
      requestAnimationFrame(updatePhysics);
    }
  }

  function updatePhysics() {
    if (activeParticles.length === 0) {
      physicsRunning = false;
      return;
    }

    const gravity = 0.52;
    const floorY = window.innerHeight - 45;

    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];

      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;

      if (p.y >= floorY) {
        p.y = floorY;
        p.vy = -p.vy * 0.58;
        p.vx *= 0.84;
        p.bounces++;
      }

      if (p.x <= 10) {
        p.x = 10;
        p.vx = -p.vx * 0.7;
      } else if (p.x >= window.innerWidth - 45) {
        p.x = window.innerWidth - 45;
        p.vx = -p.vx * 0.7;
      }

      if (p.bounces >= 3) {
        p.opacity -= 0.02;
      }

      if (p.opacity <= 0) {
        p.el.remove();
        activeParticles.splice(i, 1);
        continue;
      }

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg)`;
      p.el.style.opacity = p.opacity;
    }

    requestAnimationFrame(updatePhysics);
  }

  if (footerLogoRow) {
    footerLogoRow.addEventListener('click', triggerSmoothSquish);
  }
});
