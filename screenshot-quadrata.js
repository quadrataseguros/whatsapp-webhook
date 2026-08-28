const puppeteer = require('puppeteer');

const SCRATCHPAD = '/tmp/claude-0/-home-user-whatsapp-webhook/347b8556-5e2e-5d01-b0b7-89ad956d4c0d/scratchpad';
const BASE = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // ═══ App do cliente ═══
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('console', m => m.type() === 'error' && console.log('  [browser error]', m.text().slice(0, 120)));

  await page.goto(`${BASE}/quadrata/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2500);
  await page.screenshot({ path: `${SCRATCHPAD}/app-01-login.png` });
  console.log('✓ app-01-login');

  // Login real: CPF + senha
  const inputs = await page.$$('input');
  console.log('  inputs encontrados:', inputs.length);
  if (inputs.length >= 2) {
    await inputs[0].click();
    await page.keyboard.type('12345678900', { delay: 50 });
    await inputs[1].click();
    await page.keyboard.type('123456', { delay: 50 });
    await sleep(500);
    await page.screenshot({ path: `${SCRATCHPAD}/app-02-login-preenchido.png` });
    console.log('✓ app-02-login-preenchido');

    // Clica no botão ENTRAR procurando pelo texto
    const clicked = await page.evaluate(() => {
      const els = [...document.querySelectorAll('div')];
      const btn = els.find(e => e.textContent.trim() === 'ENTRAR' && e.children.length === 0);
      if (btn) {
        let target = btn;
        for (let i = 0; i < 4 && target.parentElement; i++) {
          target = target.parentElement;
          if (target.getAttribute('tabindex') !== null || target.onclick) break;
        }
        target.click();
        return true;
      }
      return false;
    });
    console.log('  botão ENTRAR clicado:', clicked);
    await sleep(4000);
    await page.screenshot({ path: `${SCRATCHPAD}/app-03-inicio.png` });
    console.log('✓ app-03-inicio');
  }

  const clientScreens = [
    { path: '/quadrata/(tabs)/seguros', name: 'app-04-seguros' },
    { path: '/quadrata/screens/seguro-detalhe?id=1', name: 'app-05-detalhe' },
    { path: '/quadrata/screens/boleto', name: 'app-06-boleto' },
    { path: '/quadrata/(tabs)/sinistros', name: 'app-07-sinistros' },
    { path: '/quadrata/(tabs)/perfil', name: 'app-08-perfil' },
  ];
  for (const s of clientScreens) {
    try {
      await page.goto(BASE + s.path, { waitUntil: 'networkidle0', timeout: 25000 });
      await sleep(2800);
      await page.screenshot({ path: `${SCRATCHPAD}/${s.name}.png` });
      console.log('✓', s.name);
    } catch (e) { console.log('✗', s.name, e.message); }
  }

  // ═══ Painel Admin ═══
  const admin = await browser.newPage();
  await admin.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle0', timeout: 25000 });
  await sleep(900);
  await admin.screenshot({ path: `${SCRATCHPAD}/admin-01-login.png` });
  console.log('✓ admin-01-login');

  await admin.type('#login-pass', 'quadrata2025', { delay: 40 });
  await admin.click('#login-screen .btn-primary');
  await admin.waitForFunction(() => document.getElementById('login-screen').classList.contains('hidden'), { timeout: 10000 });
  await sleep(2000);
  await admin.screenshot({ path: `${SCRATCHPAD}/admin-02-dashboard.png` });
  console.log('✓ admin-02-dashboard');

  for (const p of [
    { fn: 'clientes', name: 'admin-03-clientes' },
    { fn: 'apolices', name: 'admin-04-apolices' },
    { fn: 'boletos',  name: 'admin-05-boletos' },
  ]) {
    await admin.evaluate(fn => goTo(fn), p.fn);
    await sleep(1600);
    await admin.screenshot({ path: `${SCRATCHPAD}/${p.name}.png` });
    console.log('✓', p.name);
  }

  await admin.evaluate(() => openModalApolice());
  await sleep(1800);
  await admin.screenshot({ path: `${SCRATCHPAD}/admin-06-modal-apolice.png` });
  console.log('✓ admin-06-modal-apolice');

  await browser.close();
  console.log('\nDone!');
})();
