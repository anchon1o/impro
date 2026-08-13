#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Detecta compoñentes JSX usados sen importar nin definir.

`npm run build` NON detecta isto: Rollup asume que un identificador
descoñecido é unha variable global e compila sen queixarse. O erro só aparece
ao executar, como «X is not defined», e derruba toda a árbore de React.
"""
import re, glob, sys, os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
ficheiros = sorted(glob.glob(BASE + '/*.jsx') + glob.glob(BASE + '/**/*.jsx', recursive=True))

# Etiquetas HTML nativas: non precisan import
HTML = set('''a abbr address area article aside audio b base bdi bdo blockquote body br button
canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed
fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input
ins kbd label legend li link main map mark meta meter nav noscript object ol optgroup option
output p param picture pre progress q rp rt ruby s samp script section select small source span
strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track
u ul var video wbr svg path circle rect line g defs text tspan'''.split())

problemas = []
for f in ficheiros:
    txt = open(f, errors='surrogateescape').read()
    # Compoñentes usados en JSX: <Nome ...  (maiúscula inicial)
    usados = set(re.findall(r'<([A-Z][A-Za-z0-9_]*)', txt))
    # Importados
    importados = set()
    for m in re.finditer(r'import\s+(?:\{([^}]*)\}|([A-Za-z0-9_]+))\s+from', txt):
        if m.group(1):
            for n in m.group(1).split(','):
                n = n.strip().split(' as ')[-1].strip()
                if n: importados.add(n)
        if m.group(2): importados.add(m.group(2).strip())
    # Definidos no propio ficheiro
    definidos = set(re.findall(r'(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)', txt))
    falta = sorted(u for u in usados if u not in importados and u not in definidos and u not in HTML)
    if falta:
        problemas.append((os.path.relpath(f, BASE), falta))

if problemas:
    print('❌ COMPOÑENTES USADOS SEN IMPORTAR:')
    for f, l in problemas:
        print('   %-28s %s' % (f, ', '.join(l)))
    sys.exit(1)
print('✅ Todos os compoñentes JSX están importados ou definidos (%d ficheiros)' % len(ficheiros))
