#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Игротека: сборка раздела «Новости» из текстового файла news.txt.

Как добавить новость:
  1. Открой news.txt и добавь блок в конец файла (образец смотри там же).
  2. Запусти:  python make_news.py
  3. Загрузи на сайт файлы, которые перечислит скрипт.
Скрипт создаёт news.html, news-<имя>.html и обложку news-<имя>.jpg (если её ещё нет),
обновляет блок «Новости» в index.html и записи в sitemap.xml.
Обложки рисует библиотека Pillow (pip install pillow). Без неё берётся og-home.jpg.
"""
import os, re, json, html, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://shahta-peach.vercel.app'
CATS = {  # id: (название, цвет значка)
    'updates': ('Обновления', '#5b3df5'), 'new-games': ('Новые игры', '#087a5a'),
    'events': ('События', '#b45309'), 'announcements': ('Объявления', '#1d4ed8')}
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
WARN, CHANGED = [], []
E = lambda s: html.escape(str(s), quote=True)
ru = lambda d: '%d %s %d' % (d.day, MONTHS[d.month - 1], d.year)


def warn(m): WARN.append(m)


def write(path, text):
    old = open(path, encoding='utf-8').read() if os.path.exists(path) else None
    if old != text:
        open(path, 'w', encoding='utf-8').write(text); CHANGED.append(path)


# ---------- чтение news.txt
def parse():
    posts, cur = [], None
    for line in open('news.txt', encoding='utf-8').read().split('\n'):
        m = re.match(r'^===\s*([a-z0-9-]+)\s*$', line)
        if m:
            if cur: posts.append(cur)
            cur = {'slug': m.group(1), 'meta': {}, 'body': [], 'in': False}; continue
        if cur is None: continue
        if not cur['in']:
            if line.strip() == '---': cur['in'] = True; continue
            mm = re.match(r'^([a-z_]+):\s*(.*)$', line)
            if mm: cur['meta'][mm.group(1)] = mm.group(2).strip()
        else: cur['body'].append(line)
    if cur: posts.append(cur)
    return posts


def games():  # игры берём из каталога games.html, чтобы не хранить список дважды
    G = {}
    s = open('games.html', encoding='utf-8').read()
    for u, t, m, d in re.findall(r'<article class="pn"><h3><a href="([^"]+)">([^<]+)</a></h3><p class="mt">([^<]+)</p><p>([^<]+)</p>', s):
        G[u[:-5]] = {'u': u, 't': html.unescape(t), 'm': html.unescape(m), 'd': html.unescape(d)}
    return G


# ---------- простая разметка текста
def inline(t, G, used, slug):
    t = html.escape(t, quote=False)
    def game(m):
        if m.group(1) not in G: warn('%s: неизвестная игра [[%s]]' % (slug, m.group(1))); return m.group(0)
        used.append(m.group(1)); return '<a href="%s">%s</a>' % (G[m.group(1)]['u'], m.group(2) or '«%s»' % G[m.group(1)]['t'])
    t = re.sub(r'\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]', game, t)
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s"%s>%s</a>' % (m.group(2), ' rel="noopener"' if m.group(2).startswith('http') else '', m.group(1)), t)
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)


def render(body, G, slug):
    used, out, txt = [], [], []
    for b in re.split(r'\n\s*\n', '\n'.join(body).strip()):
        L = [x.rstrip() for x in b.split('\n') if x.strip()]
        if not L: continue
        if L[0].startswith('## '): out.append('<h2>%s</h2>' % inline(L[0][3:], G, used, slug)); L = L[1:]
        elif L[0].startswith('### '): out.append('<h3>%s</h3>' % inline(L[0][4:], G, used, slug)); L = L[1:]
        if not L: continue
        if all(x.startswith('- ') for x in L): out.append('<ul>' + ''.join('<li>%s</li>' % inline(x[2:], G, used, slug) for x in L) + '</ul>')
        elif all(re.match(r'\d+\.\s', x) for x in L): out.append('<ol>' + ''.join('<li>%s</li>' % inline(re.sub(r'^\d+\.\s+', '', x), G, used, slug) for x in L) + '</ol>')
        else: out.append('<p>%s</p>' % inline(' '.join(L), G, used, slug))
        txt.append(' '.join(L))
    return '\n'.join(out), used, ' '.join(txt)


# ---------- обложка
FONTS = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Bold.ttf']


def cover(p):
    path = 'news-%s.jpg' % p['slug']
    if p['meta'].get('image', 'auto') != 'auto': return p['meta']['image']
    if os.path.exists(path): return path
    try:
        from PIL import Image, ImageDraw, ImageFont
        fp = next(f for f in FONTS if os.path.exists(f))
    except Exception:
        warn('%s: нет Pillow или шрифта, обложка не создана (используется og-home.jpg)' % p['slug']); return 'og-home.jpg'
    W, H = 1200, 630; c = p['cat'][1].lstrip('#'); a = tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)); b = tuple(int(x * .42) for x in a)
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for k in range(W + H):
        t = k / (W + H); d.line([(k, 0), (0, k)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)), width=2)
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); o = ImageDraw.Draw(ov)
    o.ellipse([760, -220, 1360, 380], fill=(255, 255, 255, 38)); o.ellipse([900, 330, 1400, 830], fill=(255, 255, 255, 30)); o.ellipse([-200, 380, 400, 900], fill=(0, 0, 0, 40))
    im = Image.alpha_composite(im.convert('RGBA'), ov); d = ImageDraw.Draw(im); F = lambda s: ImageFont.truetype(fp, s)
    if os.path.exists('icon-512.png'):
        lg = Image.open('icon-512.png').convert('RGBA').resize((76, 76)); im.paste(lg, (80, 64), lg)
    d.text((176, 80), 'Игротека · Новости', font=F(38), fill='white')
    pill = Image.new('RGBA', (W, H), (0, 0, 0, 0))  # плашка категории: полупрозрачная, поэтому рисуем на отдельном слое
    ImageDraw.Draw(pill).rounded_rectangle([80, 190, 80 + d.textlength(p['cat'][0], font=F(30)) + 44, 246], 28, fill=(255, 255, 255, 70))
    im = Image.alpha_composite(im, pill); d = ImageDraw.Draw(im); d.text((102, 197), p['cat'][0], font=F(30), fill='white')
    size = 84
    while True:
        f, lines, cur = F(size), [], ''
        for w in p['title'].split():
            if d.textlength((cur + ' ' + w).strip(), font=f) <= 1040: cur = (cur + ' ' + w).strip()
            else: lines.append(cur); cur = w
        lines.append(cur)
        if (len(lines) <= 3 and len(lines) * int(size * 1.16) <= 250) or size <= 48: break  # блок заголовка не заходит на дату
        size -= 4
    y = 280
    for ln in lines[:3]: d.text((80, y), ln, font=f, fill='white'); y += int(size * 1.16)
    d.text((80, 548), ru(p['date']), font=F(34), fill=(255, 255, 255, 215))
    im.convert('RGB').save(path, quality=86, optimize=True); CHANGED.append(path)
    return path


# ---------- HTML
def head(title, desc, url, img, alt, ogtype, extra, ld):
    return '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(t)s</title>
<meta name="description" content="%(d)s">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="%(u)s">
<meta property="og:type" content="%(ot)s">
<meta property="og:site_name" content="Игротека">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="%(u)s">
<meta property="og:title" content="%(t)s">
<meta property="og:description" content="%(d)s">
<meta property="og:image" content="%(i)s">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="%(a)s">
%(x)s<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%(t)s">
<meta name="twitter:description" content="%(d)s">
<meta name="twitter:image" content="%(i)s">
<meta name="twitter:image:alt" content="%(a)s">
<meta name="theme-color" content="#f3f5fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0c18" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="site.css">
<script src="site.js" defer></script>
<script type="application/ld+json">%(l)s</script>
</head>
''' % dict(t=E(title), d=E(desc), u=url, ot=ogtype, i=BASE + '/' + img, a=E(alt), x=extra, l=json.dumps(ld, ensure_ascii=False))


NOSCRIPT = '<noscript><nav style="padding:14px"><a href="/">Главная</a> · <a href="games.html">Все игры</a> · <a href="news.html">Новости</a> · <a href="about.html">О проекте</a> · <a href="privacy.html">Политика конфиденциальности</a></nav></noscript>'


def card(p, lvl, lazy=True):
    return ('<article class="pn nc" data-c="%s"><a class="nimg" href="%s" tabindex="-1" aria-hidden="true"><img src="%s" width="1200" height="630" alt="" %sdecoding="async"></a>'
            '<div class="nb"><p class="mt"><span class="ncat" style="--cc:%s">%s</span> <time datetime="%s">%s</time></p><h%d><a href="%s">%s</a></h%d><p>%s</p></div></article>') % (
        p['cat'][2], p['url'], p['img'], 'loading="lazy" ' if lazy else '', p['cat'][1], p['cat'][0], p['date'], ru(p['date']), lvl, p['url'], E(p['title']), lvl, E(p['summary']))


def build():
    G, raw, posts = games(), parse(), []
    seen = set()
    for r in raw:
        m, s = r['meta'], r['slug']
        try:
            d = datetime.date.fromisoformat(m.get('date', ''))
            up = datetime.date.fromisoformat(m['updated']) if m.get('updated') else d
        except ValueError: warn('%s: дата должна быть вида 2026-11-07, статья пропущена' % s); continue
        if m.get('category') not in CATS or not m.get('title') or not m.get('summary') or s in seen:
            warn('%s: нужны title, summary, корректная category и уникальное имя, статья пропущена' % s); continue
        seen.add(s)
        bodyhtml, used, txt = render(r['body'], G, s)
        rel = []
        for g in [x.strip() for x in m.get('games', '').split(',') if x.strip()] + used:
            if g not in G: warn('%s: неизвестная игра «%s»' % (s, g))
            elif g not in rel: rel.append(g)
        cat = CATS[m['category']]
        t = m.get('seo_title') or m['title']
        t += ' | Игротека' if len(t) + 11 <= 62 else ''
        if len(t) > 65: warn('%s: заголовок страницы длиннее 65 символов (%d)' % (s, len(t)))
        if not 70 <= len(m['summary']) <= 165: warn('%s: summary %d символов, лучше 70-165' % (s, len(m['summary'])))
        p = dict(slug=s, title=m['title'], seo=t, summary=m['summary'], date=d, upd=up, cat=(cat[0], cat[1], m['category']), body=bodyhtml, rel=rel,
                 alt=m.get('alt', m['title']), words=len(txt.split()), meta=m, url='news-%s.html' % s)
        p['cat'] = (cat[0], cat[1], m['category'])
        posts.append(p)
    posts.sort(key=lambda p: p['date'], reverse=True)
    for p in posts:
        p['cat'] = (p['cat'][0], p['cat'][1], p['cat'][2])
        p['img'] = cover(dict(p, cat=(p['cat'][0], p['cat'][1])))
    # карточкам нужен цвет: (название, id, цвет) -> удобнее хранить отдельно
    for p in posts:
        cid = p['cat'][2]; p['cat'] = (CATS[cid][0], CATS[cid][1], cid)

    for p in posts:
        url = BASE + '/' + p['url']; img = BASE + '/' + p['img']
        ld = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Article', '@id': url + '#article', 'headline': p['title'][:110], 'description': p['summary'], 'image': [img],
             'datePublished': str(p['date']), 'dateModified': str(p['upd']), 'inLanguage': 'ru', 'articleSection': p['cat'][0], 'url': url,
             'mainEntityOfPage': {'@type': 'WebPage', '@id': url},
             'author': {'@type': 'Organization', 'name': 'Игротека', 'url': BASE + '/'},
             'publisher': {'@type': 'Organization', 'name': 'Игротека', 'url': BASE + '/', 'logo': {'@type': 'ImageObject', 'url': BASE + '/icon-512.png'}},
             **({'mentions': [{'@type': 'VideoGame', 'name': G[g]['t'], 'url': BASE + '/' + G[g]['u']} for g in p['rel']]} if p['rel'] else {})},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': BASE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Новости', 'item': BASE + '/news.html'},
                {'@type': 'ListItem', 'position': 3, 'name': p['title']}]}]}
        extra = '<meta property="article:published_time" content="%s">\n<meta property="article:modified_time" content="%s">\n<meta property="article:section" content="%s">\n' % (p['date'], p['upd'], E(p['cat'][0]))
        others = sorted([q for q in posts if q is not p], key=lambda q: (q['cat'][2] != p['cat'][2], -q['date'].toordinal()))[:3]
        relhtml = ('<h2>Связанные игры</h2>\n<div class="about">' + ''.join(
            '<article class="pn"><h3><a href="%s">%s</a></h3><p class="mt">%s</p><p>%s</p><p><a class="btn" href="%s">Играть</a></p></article>' % (G[g]['u'], E(G[g]['t']), E(G[g]['m']), E(G[g]['d']), G[g]['u']) for g in p['rel']) + '</div>'
                   ) if p['rel'] else '<h2>Все игры Игротеки</h2>\n<p>Посмотри, во что можно сыграть прямо сейчас, в <a href="games.html">каталоге игр</a>.</p>'
        more = ('<h2>Читайте также</h2>\n<div class="about news-grid">' + ''.join(card(q, 3) for q in others) + '</div>') if others else ''
        body = ('<body class="ig ig-doc">\n' + NOSCRIPT + '\n<main class="doc nws" id="main">\n'
                '<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a> › <a href="news.html">Новости</a> › <span>%s</span></nav>\n'
                '<p class="meta"><a class="ncat" style="--cc:%s" href="news.html#%s">%s</a> · <time datetime="%s">%s</time>%s · %d мин чтения</p>\n'
                '<h1>%s</h1>\n<figure class="ncover"><img src="%s" width="1200" height="630" alt="%s" fetchpriority="high" decoding="async"></figure>\n'
                '<div class="nbody">\n%s\n</div>\n%s\n%s\n<p><a href="news.html">← Все новости</a></p>\n</main>\n</body>\n</html>\n') % (
            E(p['title']), CATS[p['cat'][2]][1], p['cat'][2], p['cat'][0], p['date'], ru(p['date']),
            (' (обновлено %s)' % ru(p['upd'])) if p['upd'] != p['date'] else '', max(1, round(p['words'] / 180)),
            E(p['title']), p['img'], E(p['alt']), p['body'], relhtml, more)
        write(p['url'], head(p['seo'], p['summary'], url, p['img'], p['alt'], 'article', extra, ld) + body)

    # список новостей
    present = [c for c in CATS if any(p['cat'][2] == c for p in posts)]
    chips = '<button type="button" class="on" data-c="all" aria-pressed="true">Все (%d)</button>' % len(posts) + ''.join(
        '<button type="button" data-c="%s" aria-pressed="false">%s (%d)</button>' % (c, CATS[c][0], sum(p['cat'][2] == c for p in posts)) for c in present)
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', '@id': BASE + '/news.html#page', 'url': BASE + '/news.html', 'name': 'Новости и обновления Игротеки', 'inLanguage': 'ru',
         'isPartOf': {'@type': 'WebSite', 'name': 'Игротека', 'url': BASE + '/'},
         'mainEntity': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': BASE + '/' + p['url'], 'name': p['title']} for i, p in enumerate(posts)]}},
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': BASE + '/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Новости'}]}]}
    script = ('<script>\n(function(){var g=document.getElementById("nlist"),b=document.querySelectorAll(".nchips button");if(!g||!b.length)return;\n'
              'function show(c){b.forEach(function(x){var on=x.dataset.c===c;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on)});g.querySelectorAll(".nc").forEach(function(a){a.hidden=!(c==="all"||a.dataset.cat===c)})}\n'
              'b.forEach(function(x){x.onclick=function(){show(x.dataset.c);history.replaceState(null,"",x.dataset.c==="all"?location.pathname:"#"+x.dataset.c)}});\n'
              'var h=location.hash.slice(1);show(h&&document.querySelector(\'.nchips [data-c="\'+h+\'"]\')?h:"all")})();\n</script>')
    cards = ''.join(card(p, 2, i > 1).replace('data-c="%s"' % p['cat'][2], 'data-cat="%s"' % p['cat'][2]) for i, p in enumerate(posts))
    lst = (head('Новости и обновления Игротеки | Игротека', 'Новости Игротеки: обновления игр, новые игры, события и объявления. Узнавай, что нового в «Орде», «Шахте», «Ферме» и других играх.',
                BASE + '/news.html', 'og-home.jpg', 'Новости и обновления Игротеки', 'website', '', ld) + '<body class="ig ig-doc">\n' + NOSCRIPT +
           '\n<main class="wrap" id="main" style="padding-top:28px">\n<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a> › <span>Новости</span></nav>\n'
           '<h1>Новости и обновления Игротеки</h1>\n<p class="lead">Здесь мы рассказываем, как развивается Игротека: что изменилось в играх, какие игры появились и о чём стоит знать игрокам.</p>\n'
           '<div class="nchips" role="group" aria-label="Категории новостей">%s</div>\n<div class="about news-grid" id="nlist">%s</div>\n'
           '<h2>Игры Игротеки</h2>\n<p class="lead">Все игры бесплатные и работают в браузере. Полный список смотри в <a href="games.html">каталоге игр</a>.</p>\n</main>\n%s\n</body>\n</html>\n') % (chips, cards, script)
    write('news.html', lst)

    # блок на главной
    if os.path.exists('index.html'):
        s = open('index.html', encoding='utf-8').read()
        blk = ('<!--news:latest:start-->\n  <h2>Новости и обновления</h2>\n  <div class="about news-grid">' + ''.join(card(p, 3) for p in posts[:3]) +
               '</div>\n  <p><a class="btn" href="news.html">Все новости</a></p>\n  <!--news:latest:end-->')
        if '<!--news:latest:start-->' in s: write('index.html', re.sub(r'<!--news:latest:start-->.*?<!--news:latest:end-->', lambda m: blk, s, flags=re.S))
        else: warn('в index.html нет меток <!--news:latest:start--> и <!--news:latest:end-->, блок на главной не обновлён')

    # sitemap.xml
    if os.path.exists('sitemap.xml') and posts:
        s = open('sitemap.xml', encoding='utf-8').read()
        urls = [(BASE + '/news.html', max(p['upd'] for p in posts))] + [(BASE + '/' + p['url'], p['upd']) for p in posts]
        blk = '<!--news:start-->\n' + ''.join(' <url><loc>%s</loc><lastmod>%s</lastmod></url>\n' % u for u in urls) + ' <!--news:end-->'
        if '<!--news:start-->' in s: write('sitemap.xml', re.sub(r'<!--news:start-->.*?<!--news:end-->', lambda m: blk, s, flags=re.S))
        else: warn('в sitemap.xml нет меток <!--news:start--> и <!--news:end-->')
    known = {p['url'] for p in posts} | {'news.html'}
    for f in sorted(os.listdir('.')):
        if re.match(r'^news-[a-z0-9-]+\.html$', f) and f not in known: warn('страница %s больше не нужна: удали её с сайта' % f)
    print('Статей: %d | категорий с новостями: %s' % (len(posts), ', '.join(CATS[c][0] for c in present)))
    print('Загрузи на сайт:' if CHANGED else 'Изменений нет.'); [print('  ' + f) for f in CHANGED]
    [print('Внимание: ' + w) for w in WARN]


build()
