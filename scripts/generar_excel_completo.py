from pathlib import Path
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import LineChart, Reference
from openpyxl.formatting.rule import CellIsRule

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "Sol_de_Casa_Nivel_1.xlsx"
DST = ROOT / "entregables" / "Sol_de_Casa_Completo.xlsx"
DST.parent.mkdir(parents=True, exist_ok=True)

wb = openpyxl.load_workbook(SRC)

if "Simulador_24m" in wb.sheetnames:
    del wb["Simulador_24m"]

ws = wb.create_sheet("Simulador_24m")
ws.views.sheetView[0].showGridLines = True

NAVY = "17324D"
BLUE_INPUT = "E8F1FA"
GREEN_BG = "E6F4EA"
RED_BG = "FCE8E6"
GRAY_BG = "F4F6F8"
BORDER_COLOR = "D0D7DE"

f_title = Font(name="Arial", size=14, bold=True, color=NAVY)
f_sub = Font(name="Arial", size=10, italic=True, color="4A5568")
f_sec = Font(name="Arial", size=11, bold=True, color=NAVY)
f_hdr = Font(name="Arial", size=9, bold=True, color="FFFFFF")
f_bold = Font(name="Arial", size=10, bold=True, color="1A202C")
f_reg = Font(name="Arial", size=10, bold=False, color="1A202C")
f_input = Font(name="Arial", size=10, bold=True, color="0B5394")

fill_hdr = PatternFill("solid", fgColor=NAVY)
fill_input = PatternFill("solid", fgColor=BLUE_INPUT)
fill_zebra = PatternFill("solid", fgColor=GRAY_BG)
fill_kpi = PatternFill("solid", fgColor="F8FAFC")

thin = Side(style="thin", color=BORDER_COLOR)
border_box = Border(left=thin, right=thin, top=thin, bottom=thin)

def merge_styled(r, c1, c2, text, font=f_reg, fill=None):
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
    for c in range(c1, c2 + 1):
        cell = ws.cell(r, c)
        cell.border = border_box
        if fill:
            cell.fill = fill
    top_left = ws.cell(r, c1, text)
    top_left.font = font
    top_left.alignment = Alignment(vertical="center")

ws["A2"] = "Sol de Casa · Nivel 3: Simulador de Caja a 24 Meses (100% Fórmulas Vivas)"
ws["A2"].font = f_title
ws["A3"] = "Conectado en vivo a 'Supuestos'. Edita las celdas azules (C6:C10 y G6:G10) para simular cualquier camino estratégico."
ws["A3"].font = f_sub

# Bloque 1 (A:C): Operación y Técnicos -> valores en C6:C10
ws["A5"] = "1. Operación y técnicos (editable)"
ws["A5"].font = f_sec
params_izq = [
    (6, "Costo mensual técnico extra (USD)", 1800, "$#,##0"),
    (7, "Visitas extra por técnico entrenado", 50, "#,##0"),
    (8, "Mes contratación Técnico 1 (0 = no)", 1, "0"),
    (9, "Mes contratación Técnico 2 (0 = no)", 2, "0"),
    (10, "Activar filtro Meta desde mes (0 = no)", 1, "0"),
]
for r, label, val, fmt in params_izq:
    merge_styled(r, 1, 2, label, f_reg)
    c = ws.cell(r, 3, val)
    c.font = f_input
    c.fill = fill_input
    c.number_format = fmt
    c.border = border_box
    c.alignment = Alignment(horizontal="right", vertical="center")

# Bloque 2 (E:G): Camino de Inversión -> valores en G6:G10
ws["E5"] = "2. Camino de inversión en 2 fases (editable)"
ws["E5"].font = f_sec
params_der = [
    (6, "Inversión Meta · Fase 1 (USD/mes)", 4000, "$#,##0"),
    (7, "Inversión Google · Fase 1 (USD/mes)", 4000, "$#,##0"),
    (8, "Escalar inversión desde mes (0 = fija)", 3, "0"),
    (9, "Inversión Meta · Fase 2 (USD/mes)", 7000, "$#,##0"),
    (10, "Inversión Google · Fase 2 (USD/mes)", 6000, "$#,##0"),
]
for r, label, val, fmt in params_der:
    merge_styled(r, 5, 6, label, f_reg)
    c = ws.cell(r, 7, val)
    c.font = f_input
    c.fill = fill_input
    c.number_format = fmt
    c.border = border_box
    c.alignment = Alignment(horizontal="right", vertical="center")

# Bloque 3 (I:L): Resumen Ejecutivo con fórmulas vivas -> valores en L6:L10
ws["I5"] = "3. Resumen ejecutivo en vivo"
ws["I5"].font = f_sec
kpis = [
    (6, "Caja final al cierre del Mes 24", "=P38", "$#,##0.00"),
    (7, "Caja mínima en los 24 meses", "=MIN(P15:P38)", "$#,##0.00"),
    (8, "Instalaciones acumuladas (24 meses)", "=SUM(M15:M38)", "#,##0.0"),
    (9, "Respeta piso mínimo ($5.000)", '=IF(MIN(P15:P38)>=Supuestos!$B$30,"SÍ CUMPLE","ALERTA (< PISO)")', "@"),
    (10, "Regla Mes 19+ (no bajar inversión)", '=IF(COUNTIF(R33:R38,"BAJA INV.")=0,"SÍ CUMPLE","INCUMPLE MES 19+")', "@"),
]
for r, label, formula, fmt in kpis:
    merge_styled(r, 9, 11, label, f_bold, fill_kpi)
    c = ws.cell(r, 12, formula)
    c.font = f_bold
    c.fill = fill_kpi
    c.number_format = fmt
    c.border = border_box
    c.alignment = Alignment(horizontal="right", vertical="center")

# Tabla de 24 meses (fila 14 encabezados, filas 15..38 meses 1..24)
ws.cell(13, 1, "Flujo de caja mensual operativo (Meses 1 a 24 · la batería no entra en caja porque el caso no define su cobro)").font = f_sec
headers = [
    "Mes",
    "Meta (USD)",
    "Google (USD)",
    "Filtro (1/0)",
    "Téc. pagados",
    "Capacidad",
    "Leads Meta",
    "Leads Google",
    "Vis. ped. Google",
    "Vis. ped. Meta",
    "Vis. hech. Google",
    "Vis. hech. Meta",
    "Ventas mes",
    "Entradas caja",
    "Salidas caja",
    "Caja final",
    "Piso caja",
    "Estado reglas",
]
for col_idx, h in enumerate(headers, start=1):
    c = ws.cell(14, col_idx, h)
    c.font = f_hdr
    c.fill = fill_hdr
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = border_box
ws.row_dimensions[14].height = 28

def interp_formula(inv_cell, col_letter):
    terms = []
    for r_top in range(36, 41):
        r_bot = r_top - 1
        terms.append(
            f"MIN(MAX({inv_cell}-Supuestos!$A${r_bot},0),Supuestos!$A${r_top}-Supuestos!$A${r_bot})"
            f"*(Supuestos!${col_letter}${r_top}-Supuestos!${col_letter}${r_bot})/(Supuestos!$A${r_top}-Supuestos!$A${r_bot})"
        )
    return "+".join(terms)

for m in range(1, 25):
    r = 14 + m
    prev_ventas = "Supuestos!$B$31" if m == 1 else f"M{r-1}"
    prev_caja = "Supuestos!$B$29" if m == 1 else f"P{r-1}"

    ws.cell(r, 1, m).number_format = "0"
    ws.cell(r, 2, f"=IF(AND($G$8>0,A{r}>=$G$8),$G$9,$G$6)").number_format = "$#,##0"
    ws.cell(r, 3, f"=IF(AND($G$8>0,A{r}>=$G$8),$G$10,$G$7)").number_format = "$#,##0"
    ws.cell(r, 4, f"=IF(AND($C$10>0,A{r}>=$C$10),1,0)").number_format = "0"
    ws.cell(r, 5, f"=IF(AND($C$8>0,$C$8<=A{r}),1,0)+IF(AND($C$9>0,$C$9<=A{r}),1,0)").number_format = "0"
    ws.cell(r, 6, f"=Supuestos!$B$9+(IF(AND($C$8>0,$C$8<A{r}),1,0)+IF(AND($C$9>0,$C$9<A{r}),1,0))*$C$7").number_format = "#,##0"

    ws.cell(r, 7, f"=({interp_formula(f'B{r}', 'B')})*(1-D{r}*Supuestos!$B$19)").number_format = "#,##0.0"
    ws.cell(r, 8, f"={interp_formula(f'C{r}', 'C')}").number_format = "#,##0.0"

    ws.cell(r, 9, f"=H{r}*Supuestos!$B$15*Supuestos!$B$16*Supuestos!$B$17").number_format = "#,##0.00"
    ws.cell(r, 10, f"=G{r}*IF(D{r}=1,Supuestos!$B$20*Supuestos!$B$21*Supuestos!$B$22,Supuestos!$B$11*Supuestos!$B$12*Supuestos!$B$13)").number_format = "#,##0.00"
    ws.cell(r, 11, f"=MIN(I{r},F{r})").number_format = "#,##0.00"
    ws.cell(r, 12, f"=MIN(J{r},MAX(0,F{r}-K{r}))").number_format = "#,##0.00"
    ws.cell(r, 13, f"=K{r}*Supuestos!$B$18+L{r}*IF(D{r}=1,Supuestos!$B$23,Supuestos!$B$14)").number_format = "#,##0.00"

    ws.cell(r, 14, f"=Supuestos!$B$4*0.5*(M{r}+{prev_ventas})").number_format = "$#,##0.00"
    ws.cell(
        r,
        15,
        f"=Supuestos!$B$4*(Supuestos!$B$5+Supuestos!$B$7)*M{r}+Supuestos!$B$4*Supuestos!$B$6*{prev_ventas}+Supuestos!$B$8*(K{r}+L{r})+B{r}+C{r}+Supuestos!$B$28+$C$6*E{r}",
    ).number_format = "$#,##0.00"
    ws.cell(r, 16, f"={prev_caja}+N{r}-O{r}").number_format = "$#,##0.00"
    ws.cell(r, 17, "=Supuestos!$B$30").number_format = "$#,##0"

    if m < 19:
        estado_f = f'=IF(P{r}<Supuestos!$B$30,"BAJO PISO","OK")'
    else:
        estado_f = f'=IF(P{r}<Supuestos!$B$30,"BAJO PISO",IF((B{r}+C{r})<(B{r-1}+C{r-1}),"BAJA INV.","OK"))'
    ws.cell(r, 18, estado_f)

    for c_idx in range(1, 19):
        cell = ws.cell(r, c_idx)
        cell.font = f_bold if c_idx in (1, 16, 18) else f_reg
        if m % 2 == 0:
            cell.fill = fill_zebra
        cell.border = border_box
        if c_idx in (1, 4, 5, 18):
            cell.alignment = Alignment(horizontal="center")

red_fill = PatternFill(start_color=RED_BG, end_color=RED_BG, fill_type="solid")
green_fill = PatternFill(start_color=GREEN_BG, end_color=GREEN_BG, fill_type="solid")
ws.conditional_formatting.add("P15:P38", CellIsRule(operator="lessThan", formula=["Supuestos!$B$30"], fill=red_fill, font=Font(name="Arial", bold=True, color="9B1C1C")))
ws.conditional_formatting.add("R15:R38", CellIsRule(operator="notEqual", formula=['"OK"'], fill=red_fill, font=Font(name="Arial", bold=True, color="9B1C1C")))
ws.conditional_formatting.add("R15:R38", CellIsRule(operator="equal", formula=['"OK"'], fill=green_fill, font=Font(name="Arial", bold=True, color="1E4620")))

# Tabla comparativa de referencia de los 5 caminos (filas 41-47, columnas A..I)
ws.cell(41, 1, "Comparativa de los 5 caminos estratégicos evaluados").font = f_sec
ws.merge_cells("A42:B42")
comp_headers = [(1, 2, "Camino estratégico"), (3, 3, "Fase 1"), (4, 4, "Fase 2 (M3)"), (5, 6, "Filtro y técnicos"), (7, 7, "Caja mín."), (8, 8, "Caja Mes 24"), (9, 9, "Instal. 24m")]
for c1, c2, h in comp_headers:
    if c1 != c2:
        ws.merge_cells(start_row=42, start_column=c1, end_row=42, end_column=c2)
    for c in range(c1, c2 + 1):
        cell = ws.cell(42, c)
        cell.fill = fill_hdr
        cell.border = border_box
    top = ws.cell(42, c1, h)
    top.font = f_hdr
    top.alignment = Alignment(horizontal="center", vertical="center")

planes_ref = [
    ("1. Actual ($4k/$4k fijo)", "$4k / $4k", "Fijo", "Sin filtro · 0 téc.", 15736.30, 117273.39, 535.6),
    ("2. Agencia ($8k Meta / $0 Google)", "$8k / $0", "Fijo", "Sin filtro · 0 téc.", -60897.82, -60897.82, 419.1),
    ("3. Propio A · Filtro + 1 técnico", "$4k / $6k", "Fijo", "Filtro M1 · Téc. M1", 7984.08, 485241.18, 882.2),
    ("4. Propio B · Escala segura (REC.)", "$4k / $4k", "$7k / $6k", "Filtro M1 · Téc. M1, M2", 10617.75, 677256.55, 1118.5),
    ("5. Propio C · Máxima caja", "$4k / $6k", "$7k / $6k", "Filtro M1 · Téc. M1, M2", 6184.08, 681010.33, 1123.8),
]
for idx, (nom, f1, f2, op, cmin, cm24, inst) in enumerate(planes_ref, start=43):
    bg = green_fill if idx == 46 else (red_fill if idx == 44 else None)
    fn = f_bold if idx == 46 else f_reg
    merge_styled(idx, 1, 2, nom, fn, bg)
    merge_styled(idx, 5, 6, op, fn, bg)
    for col_i, val, fmt in [(3, f1, "@"), (4, f2, "@"), (7, cmin, "$#,##0"), (8, cm24, "$#,##0"), (9, inst, "#,##0.0")]:
        c = ws.cell(idx, col_i, val)
        c.font = fn
        if bg:
            c.fill = bg
        c.border = border_box
        c.number_format = fmt
        if col_i in (3, 4):
            c.alignment = Alignment(horizontal="center")

# Auditoría manual del Mes 1 (Plan Actual) en filas 50-60 (columnas A..E combinadas + F valor)
ws.cell(50, 1, "Verificación paso a paso del Mes 1 (Plan Actual $4k/$4k · cuadra exacto con 'Resultados'!B33 = $15.736,30)").font = f_sec
audit_rows = [
    ("Caja inicial al arrancar el Mes 1", "=Supuestos!$B$29"),
    ("(+) Cobro 50% de las 22 ventas cerradas el mes anterior", "=Supuestos!$B$4*0.5*Supuestos!$B$31"),
    ("(+) Cobro 50% de las 22,32 ventas nuevas cerradas en el Mes 1", "=Supuestos!$B$4*0.5*Resultados!B23"),
    ("(=) Total entradas de caja en el Mes 1", "=F52+F53"),
    ("(-) Equipos (55%) + Comisión (3%) pagados al contado por ventas del Mes 1", "=Supuestos!$B$4*(Supuestos!$B$5+Supuestos!$B$7)*Resultados!B23"),
    ("(-) Mano de obra de instalación (17%) de las 22 ventas del mes anterior", "=Supuestos!$B$4*Supuestos!$B$6*Supuestos!$B$31"),
    ("(-) Costo operativo de las 97,49 visitas técnicas realizadas ($60 c/u)", "=Supuestos!$B$8*(Resultados!B18+Resultados!B19)"),
    ("(-) Anuncios del mes ($8.000) + Costos fijos mensuales ($18.000)", "=Resultados!B28+Supuestos!$B$28"),
    ("(=) Total salidas de caja en el Mes 1", "=SUM(F55:F58)"),
    ("(=) Caja final del Mes 1 verificada", "=F51+F54-F59"),
]
for idx, (label, formula) in enumerate(audit_rows, start=51):
    es_total = label.startswith("(=)")
    bg = green_fill if idx == 60 else (fill_kpi if es_total else None)
    merge_styled(idx, 1, 5, label, f_bold if es_total else f_reg, bg)
    c2 = ws.cell(idx, 6, formula)
    c2.font = f_bold if es_total else f_reg
    if bg:
        c2.fill = bg
    c2.number_format = "$#,##0.00"
    c2.border = border_box

# Gráfico nativo en K41
chart = LineChart()
chart.title = "Evolución de Caja a 24 Meses vs. Piso Mínimo ($5.000)"
chart.style = 10
chart.y_axis.title = "Caja (USD)"
chart.x_axis.title = "Mes"
chart.height = 12
chart.width = 18

data_ref = Reference(ws, min_col=16, max_col=17, min_row=14, max_row=38)
cats_ref = Reference(ws, min_col=1, min_row=15, max_row=38)
chart.add_data(data_ref, titles_from_data=True)
chart.set_categories(cats_ref)

chart.series[0].graphicalProperties.line.solidFill = NAVY
chart.series[0].graphicalProperties.line.width = 28000
chart.series[1].graphicalProperties.line.solidFill = "C53030"
chart.series[1].graphicalProperties.line.dashStyle = "dash"
chart.series[1].graphicalProperties.line.width = 20000

ws.add_chart(chart, "K41")

widths = {
    "A": 12, "B": 14, "C": 14, "D": 11, "E": 13, "F": 14,
    "G": 13, "H": 13, "I": 13, "J": 13, "K": 13, "L": 15,
    "M": 12, "N": 14, "O": 14, "P": 15, "Q": 12, "R": 15,
}
for col_l, w in widths.items():
    ws.column_dimensions[col_l].width = w

wb.save(DST)
print("Guardado exitosamente:", DST, "Hojas:", wb.sheetnames)

