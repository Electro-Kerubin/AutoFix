# Regenera Backend/src/proyecto/hitos-kpi.ts desde los Excel de Contexto. Requiere: pip install openpyxl
import json, re, sys
import openpyxl

import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def filas(path):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    return [[('' if c is None else str(c).strip()) for c in r] for r in ws.iter_rows(values_only=True)]

hitos = []
for r in filas(os.path.join(root, 'Contexto', 'Hitos_Proyecto_SUGO_AutoFix_5.xlsx')):
    if re.fullmatch(r'H\d+', r[0]):
        m = re.search(r'(\d{2})-(\d{2})-(\d{4})', r[3])
        hitos.append({
            'id': r[0], 'logro': r[1], 'actividades': r[2],
            'semana': r[3], 'fecha': f'{m.group(3)}-{m.group(2)}-{m.group(1)}',
            'evidencia': r[4], 'indicador': r[5], 'criterio': r[6], 'valida': r[7], 'accion': r[8],
        })

kpis = []
for r in filas(os.path.join(root, 'Contexto', 'KPI_Proyecto_SUGO_AutoFix_v4.xlsx')):
    if re.fullmatch(r'\d+', r[0]):
        kpis.append({
            'n': int(r[0]), 'ambito': r[1], 'nombre': r[2], 'formula': r[3], 'variables': r[4],
            'unidad': r[5], 'meta': r[6], 'interpretacion': r[7],
        })

assert len(hitos) == 14, len(hitos)
assert len(kpis) == 25, len(kpis)

salida = (
    '// Generado desde Hitos_Proyecto_SUGO_AutoFix_5.xlsx y KPI_Proyecto_SUGO_AutoFix_v4.xlsx (carpeta Contexto).\n'
    'export const HITOS_SUGO = ' + json.dumps(hitos, ensure_ascii=False, indent=2) + ' as const;\n\n'
    'export const KPI_SUGO = ' + json.dumps(kpis, ensure_ascii=False, indent=2) + ' as const;\n'
)
open(os.path.join(root, 'Backend', 'src', 'proyecto', 'hitos-kpi.ts'), 'w', encoding='utf-8', newline='\n').write(salida)
print(len(hitos), len(kpis), [h['fecha'] for h in hitos])
