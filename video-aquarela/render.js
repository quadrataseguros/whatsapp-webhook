// Renderiza animacao.html quadro a quadro e monta o MP4 com ffmpeg.
// Uso: node render.js [fps=24] [saida=aquarela.mp4]
// Sem argumentos extras, gera também um quadro de teste se TESTE=t1,t2,... estiver definido.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const FPS = parseInt(process.argv[2] || '24', 10);
const OUT = process.argv[3] || 'aquarela.mp4';
const TOTAL = parseFloat(process.env.TOTAL || '25');
const here = __dirname;
const frames = path.join(process.env.FRAMES_DIR || path.join(here, '.frames'));

(async () => {
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await page.goto('file://' + path.join(here, process.env.HTML || 'animacao.html'));

  if (process.env.TESTE) {
    for (const t of process.env.TESTE.split(',')) {
      await page.evaluate(x => render(x), parseFloat(t));
      await page.screenshot({ path: path.join(frames, `teste_${t}.png`) });
    }
    await browser.close();
    return;
  }

  const n = TOTAL * FPS;
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => render(t), i / FPS);
    await page.screenshot({ path: path.join(frames, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 60 === 0) console.log(`quadro ${i}/${n}`);
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart',
    path.join(here, OUT)], { stdio: 'inherit' });
  console.log('ok ->', OUT);
})();
