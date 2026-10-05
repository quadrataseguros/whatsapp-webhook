"""Gera 10 ilustrações sóbrias (silhuetas em luz dourada) em imagens/01..10.jpg, 1080x1920.
Substitua por fotos reais quando tiver (mesmos nomes de arquivo)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import os, random
W, H = 1080, 1920
random.seed(7); np.random.seed(7)
DARK = (22, 18, 20)

def grad(stops):
    """gradiente vertical; stops = [(pos0-1, (r,g,b)), ...]"""
    ys = np.linspace(0, 1, H)
    pos = [p for p, _ in stops]
    out = np.zeros((H, W, 3), np.uint8)
    for c in range(3):
        col = np.interp(ys, pos, [s[1][c] for s in stops])
        out[:, :, c] = col[:, None]
    return Image.fromarray(out)

def glow(img, cx, cy, r, color, strength=0.9):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    base = np.asarray(img).astype(float)
    for c in range(3):
        base[:, :, c] = base[:, :, c] * (1 - a) + color[c] * a
    return Image.fromarray(base.astype(np.uint8))

def person(d, x, gy, h, col=DARK, arms=None):
    """silhueta de pé; x centro, gy chão, h altura"""
    hr = h * 0.065
    d.ellipse([x - hr, gy - h, x + hr, gy - h + 2 * hr], fill=col)
    d.rounded_rectangle([x - h * .11, gy - h + 2.1 * hr, x + h * .11, gy - h * .45], radius=h * .05, fill=col)
    d.polygon([(x - h * .10, gy - h * .5), (x + h * .10, gy - h * .5), (x + h * .08, gy), (x + h * .01, gy), (x, gy - h * .3), (x - h * .01, gy - h * .3), (x - h * .01, gy), (x - h * .08, gy)], fill=col)
    if arms:
        d.line(arms, fill=col, width=int(h * .05), joint="curve")

def finish(img, name, soften=1.6):
    img = img.filter(ImageFilter.GaussianBlur(soften))
    a = np.asarray(img).astype(float)
    a += np.random.normal(0, 5, a.shape)           # grão de filme
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.38 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
    a *= v[:, :, None]
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f"imagens/{name}.jpg", quality=92)

def sky_sunset():
    return grad([(0, (38, 54, 78)), (.45, (150, 112, 98)), (.62, (240, 176, 108)), (1, (60, 44, 40))])

def hills(img, base, amp, col, seed):
    d = ImageDraw.Draw(img); rnd = random.Random(seed)
    ph = [rnd.random() * 6 for _ in range(3)]
    pts = [(0, H)]
    for x in range(0, W + 20, 20):
        y = base + amp * (np.sin(x / 260 + ph[0]) + .5 * np.sin(x / 120 + ph[1]))
        pts.append((x, y))
    pts.append((W, H)); d.polygon(pts, fill=col)

os.makedirs("imagens", exist_ok=True)

# 01 criança soltando pipa
im = glow(sky_sunset(), 540, 1180, 900, (255, 205, 130)); hills(im, 1500, 40, (40, 32, 34), 1)
d = ImageDraw.Draw(im); person(d, 480, 1540, 300, arms=[(480, 1330), (560, 1280)])
kx, ky = 760, 520
d.line([(560, 1285), (650, 1000), (kx, ky + 90)], fill=(30, 26, 28), width=3)
d.polygon([(kx, ky), (kx + 55, ky + 90), (kx, ky + 190), (kx - 55, ky + 90)], fill=(30, 26, 28))
finish(im, "01")

# 02 estrada ao amanhecer
im = glow(grad([(0, (52, 66, 88)), (.5, (222, 170, 120)), (.52, (90, 80, 76)), (1, (24, 22, 24))]), 540, 960, 700, (255, 220, 160))
hills(im, 940, 30, (46, 44, 48), 2)
d = ImageDraw.Draw(im)
d.polygon([(500, 960), (580, 960), (1000, H), (80, H)], fill=(36, 33, 34))
for i in range(8):
    t0, t1 = i / 8, (i + .5) / 8
    def pt(t, w): y = 960 + t ** 1.6 * (H - 960); return (540 + w * t ** 1.6 * 300, y)
    d.polygon([pt(t0, -.5), pt(t0, .5), pt(t1, .5), pt(t1, -.5)], fill=(230, 190, 130))
fog = Image.new("RGB", (W, H), (240, 215, 185)); mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).rectangle([0, 880, W, 1050], fill=90); mask = mask.filter(ImageFilter.GaussianBlur(60))
im.paste(fog, (0, 0), mask); finish(im, "02")

# 03 mesa com luz da janela
im = grad([(0, (80, 62, 52)), (1, (36, 28, 28))])
d = ImageDraw.Draw(im); d.rectangle([160, 300, 920, 1100], fill=(250, 214, 150))
d.line([(540, 300), (540, 1100)], fill=(70, 54, 48), width=14); d.line([(160, 700), (920, 700)], fill=(70, 54, 48), width=14)
im = glow(im, 540, 700, 800, (255, 226, 170), .5); d = ImageDraw.Draw(im)
d.rectangle([0, 1300, W, H], fill=(52, 38, 32)); d.rectangle([0, 1290, W, 1310], fill=(110, 82, 62))
for x in (420, 660): d.rounded_rectangle([x - 55, 1210, x + 55, 1295], radius=18, fill=(236, 214, 188)); d.arc([x + 40, 1225, x + 90, 1275], -90, 90, fill=(236, 214, 188), width=10)
d.ellipse([480, 1286, 600, 1300], fill=(120, 90, 70)); finish(im, "03")

# 04 gestante em silhueta de perfil
im = glow(grad([(0, (86, 70, 62)), (1, (50, 38, 34))]), 700, 800, 1100, (255, 220, 160), .95)
d = ImageDraw.Draw(im); d.rectangle([520, 200, 1040, 1250], fill=(246, 208, 150)); d.line([(780, 200), (780, 1250)], fill=(90, 66, 52), width=12)
im = glow(im, 640, 820, 700, (255, 226, 176), .7); d = ImageDraw.Draw(im)
c = DARK; d.ellipse([430, 520, 540, 640], fill=c)                       # cabeça
d.polygon([(450, 630), (540, 640), (600, 900), (560, 1500), (400, 1500), (420, 900)], fill=c)  # corpo
d.ellipse([480, 880, 760, 1180], fill=c)                                 # barriga
d.line([(540, 760), (620, 1000), (640, 1030)], fill=c, width=46)         # braço apoiando
finish(im, "04")

# 05 mãe e bebê dormindo
im = glow(grad([(0, (70, 56, 54)), (1, (36, 28, 28))]), 540, 900, 1000, (250, 200, 145), .85)
d = ImageDraw.Draw(im); d.rounded_rectangle([60, 1000, 1020, 1500], radius=140, fill=(214, 186, 156))  # travesseiro/lençol
d.ellipse([280, 760, 560, 1060], fill=(70, 50, 44)); d.polygon([(330, 1030), (620, 1000), (780, 1260), (300, 1330)], fill=(90, 66, 58))  # mãe
d.ellipse([560, 960, 700, 1100], fill=(236, 196, 160)); d.ellipse([590, 1010, 650, 1060], fill=(236, 196, 160)); d.rounded_rectangle([560, 1060, 820, 1250], radius=60, fill=(245, 232, 215))  # bebê
finish(im, "05", 2)

# 06 criança caminhando até o pai
im = glow(sky_sunset(), 540, 1250, 1000, (255, 210, 140)); hills(im, 1550, 30, (44, 36, 36), 3)
d = ImageDraw.Draw(im)
person(d, 300, 1700, 260, arms=[(300, 1500), (180, 1430)])
d.line([(300, 1500), (420, 1430)], fill=DARK, width=14)
d.ellipse([715, 1270, 785, 1340], fill=DARK); d.rounded_rectangle([710, 1330, 790, 1560], radius=30, fill=DARK); d.line([(740, 1550), (720, 1690)], fill=DARK, width=36); d.line([(765, 1550), (800, 1690)], fill=DARK, width=36)
d.line([(722, 1400), (655, 1480)], fill=DARK, width=22); d.line([(780, 1400), (850, 1470)], fill=DARK, width=22)
d.polygon([(0, H), (W, H), (760, 1560), (320, 1560)], fill=(60, 48, 44)); finish(im, "06")

# 07 mão da avó e da criança
im = glow(grad([(0, (96, 76, 62)), (1, (50, 38, 34))]), 540, 900, 900, (255, 214, 156), .9)
d = ImageDraw.Draw(im); sk1, sk2 = (196, 150, 120), (228, 186, 154)
d.rounded_rectangle([140, 820, 800, 1060], radius=110, fill=sk1)           # mão grande
for i in range(4): d.rounded_rectangle([700 + i * 8, 840 + i * 52, 940, 880 + i * 52], radius=20, fill=sk1)
d.rounded_rectangle([300, 800, 760, 1090], radius=130, fill=sk2); d.rounded_rectangle([560, 880, 860, 1000], radius=55, fill=sk2)  # mão pequena
d.rounded_rectangle([-60, 880, 230, 1010], radius=60, fill=(130, 100, 92)); finish(im, "07", 2.4)

# 08 almoço em família
im = glow(grad([(0, (74, 58, 50)), (1, (34, 26, 26))]), 540, 700, 900, (255, 214, 150), .9)
d = ImageDraw.Draw(im); d.line([(540, 0), (540, 480)], fill=(30, 26, 26), width=6); d.pieslice([430, 440, 650, 600], 180, 360, fill=(250, 220, 160))
for i, (x, h) in enumerate([(200, 330), (390, 400), (590, 300), (780, 410), (930, 250)]):
    hr = h * .12; d.ellipse([x - hr, 980 - h * .6, x + hr, 980 - h * .6 + 2 * hr], fill=DARK); d.rounded_rectangle([x - h * .22, 980 - h * .6 + 2 * hr, x + h * .22, 1250], radius=40, fill=DARK)
d.rectangle([0, 1180, W, H], fill=(70, 50, 40)); d.rectangle([0, 1170, W, 1190], fill=(138, 104, 78))
for x in (300, 540, 780): d.ellipse([x - 90, 1190, x + 90, 1230], fill=(222, 196, 160))
finish(im, "08")

# 09 pais olhando o berço
im = glow(grad([(0, (44, 52, 70)), (1, (22, 20, 28))]), 540, 1300, 800, (255, 200, 140), .5)
d = ImageDraw.Draw(im)
person(d, 280, 1700, 560, arms=[(280, 1250), (460, 1380)]); person(d, 800, 1700, 540, arms=[(800, 1250), (640, 1380)])
d.rounded_rectangle([380, 1400, 700, 1560], radius=30, fill=(236, 214, 176)); d.ellipse([480, 1380, 560, 1450], fill=(246, 214, 176))
for x in range(380, 701, 40): d.line([(x, 1560), (x, 1720)], fill=(150, 112, 80), width=8)
d.rectangle([380, 1700, 700, 1716], fill=(150, 112, 80)); finish(im, "09", 2)

# 10 família abraçada diante da janela
im = glow(sky_sunset(), 540, 900, 1000, (255, 214, 140)); hills(im, 1000, 25, (52, 40, 38), 4)
d = ImageDraw.Draw(im); d.rectangle([0, 1100, W, H], fill=(40, 30, 30))
person(d, 400, 1500, 640, arms=[(400, 960), (540, 1010)]); person(d, 680, 1500, 600, arms=[(680, 960), (540, 1010)])
d.ellipse([505, 1050, 575, 1120], fill=DARK); d.rounded_rectangle([495, 1110, 585, 1330], radius=34, fill=DARK)
finish(im, "10")
print("ok")

# parede branca (tela final): luz suave de janela, sombra leve e textura de reboco
yy, xx = np.mgrid[0:H, 0:W]
base = 244 - 14 * (xx / W) - 10 * (yy / H)
a = np.stack([base, base - 1, base - 4], axis=2)
for (x0, x1, y0, y1) in [(120, 520, 160, 900), (560, 960, 160, 900)]:   # sombra da janela na parede
    m = np.zeros((H, W)); m[y0:y1, x0:x1] = 1
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))) / 255
    a -= (m * 7)[:, :, None]
a += np.random.normal(0, 2.2, a.shape)
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save("imagens/parede.jpg", quality=95)
