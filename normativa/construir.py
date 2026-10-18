# Convierte los 4 textos de normativa/fuentes en lib/normativaData.js (se ejecuta a mano cuando cambie la normativa):  python3 normativa/construir.py
import re, json, os
D = os.path.dirname(os.path.abspath(__file__)); L = lambda f: [x.rstrip() for x in open(f"{D}/fuentes/{f}.txt", encoding="utf-8").read().split("\n")]
ART = re.compile(r"^Art\.\s+(\d+|Anexo)\.\s*(.*)$"); SUB = re.compile(r"^(\d+\.\d+)\s+(\S.*)$"); TAGS = ["Importante", "Prohibido estrictamente", "Prohibido", "Obligatorio", "Obliglatorio", "Considera", "Soporte", "Apelaciones", "Sistema monetario"]
def corte(ls):
    for i, x in enumerate(ls):
        if x.strip() == "Vida Ciudadana": return i
    return len(ls)
def titulo(t):
    t = t.strip(); m = re.match(r"^(.*?)\s+[-–]\s+([^-–]{3,30})$", t)
    if m and m.group(2).strip() in TAGS: return m.group(1).strip(), m.group(2).strip().replace("Obliglatorio", "Obligatorio")
    return t, ""
def parse(f, sec, bloques=False):
    ls = L(f); fin = corte(ls); ls = ls[:fin]; out = []; blq = ""; blqT = ""; cap = ""; cur = None
    for x in ls:
        s = x.strip()
        m = re.match(r"^Bloque ([ABC]):\s*(.*)$", s)
        if bloques and m: blq, blqT, cap = m.group(1), m.group(2), ""; cur = None; continue
        m = re.match(r"^Capítulo (\d+):\s*(.*)$", s)
        if m: cap = f"Capítulo {m.group(1)}: {m.group(2)}"; cur = None; continue
        m = ART.match(s)
        if m:
            t, tag = titulo(m.group(2)); n = m.group(1)
            cur = {"id": f"{sec}-{blq + '-' if blq else ''}{n.lower()}", "sec": sec, "bloque": blq, "bloqueT": blqT, "cap": cap, "num": n, "titulo": t, "tag": tag, "intro": [], "subs": []}; out.append(cur); continue
        if not cur or not s: continue
        m = SUB.match(s)
        if m: cur["subs"].append({"n": m.group(1), "t": m.group(2), "l": []}); continue
        if s in ("Definición", "Requisitos", "Prohibiciones", "Sanciones", "Procedimiento") and (not cur["subs"] or cur["subs"][-1]["n"] == "" or cur["num"] == "Anexo"): cur["subs"].append({"n": "", "t": s, "l": []}); continue
        if re.match(r"^ANEXO\b", s, re.I): cur["subs"].append({"n": "", "t": s, "l": []}); continue
        (cur["subs"][-1]["l"] if cur["subs"] else cur["intro"]).append(s)
    return out
arts = parse("general", "gen") + parse("ciudadana", "ciu") + parse("departamental", "dep", True) + parse("delictiva", "del")
# Disposiciones finales (del texto general)
g = L("general"); i = max(k for k, x in enumerate(g) if x.strip().startswith("Disposiciones Finales y Autoridad")); j = next(k for k in range(i, len(g)) if g[k].strip() == "COMUNIDAD")
fin = [x.strip() for x in g[i + 1:j] if x.strip() and x.strip() != "Venezuela Community"]
intro = [x.strip() for x in g[:corte(g)] if x.strip()][3:]; intro = [x for x in intro if not x.startswith("Art.")][:0]
arts.append({"id": "fin-1", "sec": "fin", "bloque": "", "bloqueT": "", "cap": "", "num": "1", "titulo": "Disposiciones Finales y Autoridad de la Normativa", "tag": "", "intro": fin, "subs": []})
SECC = [{"id": "gen", "n": "General", "d": "Principios fundamentales de roleplay"}, {"id": "ciu", "n": "Ciudadana", "d": "Vida cotidiana de los ciudadanos"}, {"id": "dep", "n": "Departamental", "d": "Policía, Ejército, EMS, Bomberos, DOT y negocios"}, {"id": "del", "n": "Delictiva", "d": "Actividades delictivas y organizaciones"}, {"id": "fin", "n": "Disposiciones finales", "d": "Autoridad de la normativa"}]
BLOQ = {"A": "Departamentos primarios (Policía y Ejército)", "B": "Departamentos secundarios (EMS, Bomberos y DOT)", "C": "Negocios y locales civiles"}
open(f"{D}/../lib/normativaData.js", "w", encoding="utf-8").write("// Generado por normativa/construir.py a partir de normativa/fuentes/*.txt. No editar a mano.\nexport const SECCIONES = " + json.dumps(SECC, ensure_ascii=False) + ";\nexport const BLOQUES = " + json.dumps(BLOQ, ensure_ascii=False) + ";\nexport const ARTS = " + json.dumps(arts, ensure_ascii=False) + ";\n")
print(len(arts), {s["id"]: sum(1 for a in arts if a["sec"] == s["id"]) for s in SECC})
