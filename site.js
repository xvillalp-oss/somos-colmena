const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// preloader
const loader = document.getElementById('loader');
if (loader) {
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('done'), 350));
  setTimeout(() => loader.classList.add('done'), 1600);
}

// cursor
const cursor = document.getElementById('cursor');
if (cursor && matchMedia('(hover:hover)').matches && !reduced) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cursor.classList.add('on'); });
  (function loop(){ cx += (tx-cx)*.2; cy += (ty-cy)*.2; cursor.style.transform = `translate(${cx-7}px,${cy-7}px)`; requestAnimationFrame(loop); })();
  document.querySelectorAll('a,button,summary').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
  });
}

// palabra rotante (hero home)
const rot = document.getElementById('rotWord');
if (rot && !reduced) {
  const words = ['co.crea','co.necta','co.mparte','vive'];
  let wi = 0;
  setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => { wi = (wi+1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 280);
  }, 2400);
}

// reveals
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('inview'); io.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// nav sólida
const hdr = document.querySelector('header');
if (!hdr.hasAttribute('data-solid')) {
  addEventListener('scroll', () => hdr.classList.toggle('solid', scrollY > 40), {passive:true});
}

// menú móvil
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

// scrollytelling: palabras que se encienden
document.querySelectorAll('.scrolly').forEach(scrolly => {
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/\s+/).filter(Boolean).forEach(w => {
          const s = document.createElement('span');
          s.className = 'w' + (node.tagName === 'B' ? ' key' : '');
          s.textContent = w;
          frag.append(s, ' ');
        });
        ch.replaceWith(frag);
      } else walk(ch);
    });
  };
  walk(scrolly);
  const wordEls = [...scrolly.querySelectorAll('.w')];
  if (reduced) { wordEls.forEach(w => w.classList.add('on')); return; }
  const onScroll = () => {
    const r = scrolly.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight*.85 - r.top) / (r.height + innerHeight*.35)));
    const n = Math.floor(progress * wordEls.length * 1.15);
    wordEls.forEach((w,i) => w.classList.toggle('on', i < n));
  };
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();
});

// filas acordeón
document.querySelectorAll('.svc-row').forEach(row => {
  const btn = row.querySelector('.svc-btn');
  btn.addEventListener('click', () => {
    const open = row.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// parallax suave
const pxEls = [...document.querySelectorAll('[data-parallax]')];
if (!reduced && pxEls.length) {
  const px = () => {
    pxEls.forEach(el => {
      const f = parseFloat(el.dataset.parallax);
      const r = el.getBoundingClientRect();
      const c = r.top + r.height/2 - innerHeight/2;
      const y = Math.max(-60, Math.min(60, -c * f));
      const img = el.querySelector('img');
      if (img) img.style.transform = `scale(1.12) translateY(${y}px)`;
    });
  };
  addEventListener('scroll', () => requestAnimationFrame(px), {passive:true});
  addEventListener('resize', () => requestAnimationFrame(px));
  px();
}

/* ─────────────────────────────────────────────────────────────
   FORMULARIO DE CONTACTO
   Si WEB3FORMS_KEY está vacío → el formulario envía por WhatsApp.
   Para que los mensajes lleguen por CORREO a hola@somoscolmena.com:
     1. Entra a https://web3forms.com  (no requiere crear cuenta)
     2. Escribe hola@somoscolmena.com y te mandan un "Access Key"
     3. Pega esa key aquí abajo y vuelve a desplegar. Listo.
   ───────────────────────────────────────────────────────────── */
const WEB3FORMS_KEY = '';           // ← pegar aquí la key cuando la tengan
const WHATSAPP_NUM  = '525548158812';

const form = document.getElementById('contactForm');
if (form) {
  const msg = document.getElementById('formMsg');
  const btn = form.querySelector('button[type=submit]');
  const say = (t, cls) => { msg.textContent = t; msg.className = 'form-msg ' + (cls || ''); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.botcheck && form.botcheck.checked) return;          // antispam

    const d = {
      nombre: form.nombre.value.trim(),
      organizacion: form.organizacion.value.trim(),
      email: form.email.value.trim(),
      mensaje: form.mensaje.value.trim()
    };
    if (!d.nombre || !d.organizacion || !d.email || !d.mensaje) {
      return say('Por favor completa todos los campos.', 'err');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      return say('Revisa que el correo esté bien escrito.', 'err');
    }

    // Opción A — correo real (cuando haya key)
    if (WEB3FORMS_KEY) {
      btn.disabled = true; say('Enviando…');
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: `Nuevo mensaje de ${d.nombre} (${d.organizacion}) — somoscolmena.com`,
            from_name: 'Web co.lmena',
            ...d
          })
        });
        const j = await r.json();
        if (j.success) { form.reset(); say('¡Gracias! Recibimos tu mensaje y te contactamos pronto.', 'ok'); }
        else throw new Error(j.message || 'error');
      } catch (err) {
        say('No se pudo enviar. Escríbenos a hola@somoscolmena.com o por WhatsApp.', 'err');
      } finally { btn.disabled = false; }
      return;
    }

    // Opción B — WhatsApp (activa mientras no haya key)
    const texto = [
      'Hola co.lmena 👋', '',
      `*Nombre:* ${d.nombre}`,
      `*Organización:* ${d.organizacion}`,
      `*Email:* ${d.email}`, '',
      d.mensaje
    ].join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(texto)}`, '_blank');
    form.reset();
    say('Abrimos WhatsApp con tu mensaje listo para enviar. ¡Gracias!', 'ok');
  });
}
