const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'quadrata-app/dist');

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  if (!path.extname(filePath)) filePath += '.html';
  if (!fs.existsSync(filePath)) filePath = path.join(distDir, 'index.html');
  const ext = path.extname(filePath).replace('.', '');
  const mimes = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', json: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' };
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(distDir, 'index.html')));
  }
});

const SCRATCHPAD = '/tmp/claude-0/-home-user-whatsapp-webhook/347b8556-5e2e-5d01-b0b7-89ad956d4c0d/scratchpad';

(async () => {
  server.listen(3457);
  console.log('Server started on :3457');

  const browser = await puppeteer.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  const screens = [
    { url: 'http://localhost:3457/login', name: '01-login' },
    { url: 'http://localhost:3457/(tabs)/inicio', name: '02-inicio' },
    { url: 'http://localhost:3457/(tabs)/seguros', name: '03-seguros' },
    { url: 'http://localhost:3457/(tabs)/sinistros', name: '04-sinistros' },
    { url: 'http://localhost:3457/(tabs)/mensagens', name: '05-mensagens' },
    { url: 'http://localhost:3457/(tabs)/perfil', name: '06-perfil' },
    { url: 'http://localhost:3457/screens/cotacao', name: '07-cotacao' },
    { url: 'http://localhost:3457/screens/assistencia', name: '08-assistencia' },
    { url: 'http://localhost:3457/screens/sinistro', name: '09-sinistro' },
    { url: 'http://localhost:3457/screens/boleto', name: '10-boleto' },
  ];

  for (const s of screens) {
    try {
      await page.goto(s.url, { waitUntil: 'networkidle0', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));
      const outPath = `${SCRATCHPAD}/${s.name}.png`;
      await page.screenshot({ path: outPath });
      console.log('✓', s.name, '->', outPath);
    } catch (e) {
      console.log('✗', s.name, e.message);
    }
  }

  await browser.close();
  server.close();
  console.log('\nAll done!');
})();
