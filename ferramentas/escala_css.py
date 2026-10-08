"""Gera css/style-desktop.css a partir de css/style.css com tudo 10% menor
(equivale ao zoom de 90% do navegador). No celular continua valendo o style.css.
Uso: python3 ferramentas/escala_css.py   (rodar sempre que mudar o style.css)"""
import os, re
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FATOR = 0.9
s = open(os.path.join(RAIZ, 'css', 'style.css'), encoding='utf8').read()
i = s.index('/* PDF */'); j = s.index('/* FIM PDF */', i)   # bloco do PDF fica igual
prot = re.compile(r'\((?:min|max)-(?:width|height):\s*[\d.]+px\)')          # pontos de quebra ficam iguais
def px(m):
    v = float(m.group(1))
    if abs(v) <= 2: return m.group(0)                                         # bordas finas ficam iguais
    n = round(v * FATOR, 1); return (str(int(n)) if n == int(n) else str(n)) + 'px'
def escala(t):
    out, k = [], 0
    for m in prot.finditer(t):
        out.append(re.sub(r'(-?\d*\.?\d+)px', px, t[k:m.start()])); out.append(m.group()); k = m.end()
    out.append(re.sub(r'(-?\d*\.?\d+)px', px, t[k:])); return ''.join(out)
r = escala(s[:i]) + s[i:j] + escala(s[j:])
r = r.replace('html,body{height:100%}', 'html{font-size:90%}\nhtml,body{height:100%}', 1)
open(os.path.join(RAIZ, 'css', 'style-desktop.css'), 'w', encoding='utf8').write('/* GERADO por ferramentas/escala_css.py a partir de style.css: não edite à mão. */\n' + r)
print('css/style-desktop.css gerado')
