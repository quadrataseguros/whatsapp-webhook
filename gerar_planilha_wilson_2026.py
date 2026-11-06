#!/usr/bin/env python3
"""Planilha de Comissões — Wilson (clientes novos) + Fabrício (parcelas em aberto)
Período: mai/2026 – nov/2026  |  Formato parcelado mensal
"""
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

# ---------------------------------------------------------------------------
# DADOS
# ---------------------------------------------------------------------------
MONTHS    = ["mai/26", "jun/26", "jul/26", "ago/26", "set/26", "out/26", "nov/26"]
MONTH_IDX = {m: i for i, m in enumerate(MONTHS)}

# Clientes de Fabrício com parcelas ainda abertas a partir de mai/26
# (nome, seguradora, item, coms_pct, prêmio, total_parc, 1ª_parc_em_mai/26)
FABRICIO_CONT = [
    ("LEONARDO VAZ DE FREITAS",         "SUHAI",        "TUCSON",    25.0, 1_689.84, 12, 12),
    ("ANDREA NASC. SANTANA MARTIENA",   "TOKIO MARINE", "CRETA",     20.0, 1_986.95, 12, 11),
    ("IVO REIS DO NASCIMENTO",          "MITSUI",       "FOX",       20.0, 2_141.74, 10, 10),
    ("LEIDE DAYANE DE SOUZA",           "SUHAI",        "SUZUKI",    22.0, 1_835.77, 12,  7),
    ("LEIDE DAYANE DE SOUZA",           "ALIRO",        "ECOSPORT",  20.0, 1_642.98, 10, 10),
    ("LEIDE DAYANE DE SOUZA",           "ALIRO",        "COMPASS",   20.0, 3_390.27, 10,  7),
    ("WILSON FRANCISCO NASCIMENTO",     "SUHAI",        "CITY",      10.0, 1_620.86, 12,  7),
    ("CHRISTIAN DO NASCIMENTO",         "AZUL SEGUROS", "TIGGO",     20.0, 1_559.48,  6,  6),
    ("PAULO SERGIO LADUANO",            "HDI",          "COROLLA",   20.0, 1_853.86,  6,  6),
    ("LUIZ ANTONIO DE CARVALHO",        "SUHAI",        "SPORTAGE",  20.0, 1_640.47,  8,  6),
    ("FABIO FRANCISCO DA SILVA",        "SUHAI",        "XTZ 250",   20.0,   651.42,  7,  6),
    ("ELIZABETH IZAGUIRRE GOMES",       "HDI",          "PALIO",     20.0,   920.16, 10,  4),
    ("SOLANGE SILVA DE JESUS",          "TOKIO MARINE", "I30",       25.0, 1_537.17, 12,  3),
]

# Clientes novos Wilson (vigência inicial mai–nov/2026)
# (nome, seguradora, item, prêmio, total_parc, mês_início)
WILSON_NEW = [
    ("ROSANGELA DE JESUS MELO",             "SUHAI",        "IDEA DFW4C64",          1_414.18,  6, "mai/26"),
    ("ROSEMEIRE SAMPAIO ROCHA",             "AZUL SEGUROS", "POLO SEDAN FSY3B13",    2_114.88, 10, "mai/26"),
    ("JULIO CESAR ALMEIDA DE OLIVEIRA",     "SUHAI",        "CG 160 FAN GEB0F70",      722.68,  3, "mai/26"),
    ("IRIS NASCIMENTO LESSE",               "SUHAI",        "ELITE TLS4C20",           954.12, 12, "mai/26"),
    ("JOSE NILTON DOS SANTOS",              "PORTO SEGURO", "HR-V GBY1495",          1_910.52,  4, "jun/26"),
    ("OTAVIANO DE JESUS",                   "PORTO SEGURO", "CORSA ATB3223",         2_311.81, 10, "jun/26"),
    ("JOSE MARIA COELHO",                   "ZURICH",       "T-CROSS FZX2J64",       4_095.68, 10, "jun/26"),
    ("LEONARDO VAZ DE FREITAS",             "SUHAI",        "TUCSON HKT1J57",        1_747.26, 12, "jun/26"),
    ("VALDISLEI XAVIER DO NASCIMENTO",      "YELUM",        "COROLLA FFS7573",       2_886.31, 10, "jul/26"),
    ("IVO REIS DO NASCIMENTO",              "AZUL SEGUROS", "CITY DPJ0517",            981.51, 10, "ago/26"),
    ("IVO REIS DO NASCIMENTO",              "MITSUI",       "FOX FPZ0086",           1_978.61, 10, "ago/26"),
    ("ANDREA NASCIMENTO SANTANA MARTIENA",  "AZUL SEGUROS", "CRETA SYD1B66",         1_541.46, 12, "ago/26"),
    ("DIANDARA DE SOUSA CARVALHO",          "TOKIO MARINE", "A CONFIRMAR",               0.00,  1, "set/26"),
    ("ADAILTON DE JESUS BARRETO SALES",     "SUHAI",        "CG 160 USB5H79",        2_230.15, 12, "set/26"),
    ("ADAILTON DE JESUS BARRETO SALES",     "ALLIANZ",      "PRISMA LT FVA0076",     2_522.41, 10, "out/26"),
    ("CAIQUE FREITAS SOUZA",                "HDI",          "PICANTO EZH6G23",       1_788.05, 12, "out/26"),
    ("LEIDE DAYANE DE SOUZA",               "SUHAI",        "DL 1000 GIB7F31",       1_176.92, 12, "out/26"),
    ("FERNANDA APARECIDA DE ARAUJO",        "PORTO SEGURO", "HB20 FIU0950",          1_540.73, 12, "nov/26"),
]

# ---------------------------------------------------------------------------
# Monta MESES: (nome, seg, item, prêmio, coms_pct|None, total, parc_num, parc_tot)
# Fabrício primeiro (ordem original), Wilson depois (ordem por mês de início)
# ---------------------------------------------------------------------------
MESES = {m: [] for m in MONTHS}

for fab in FABRICIO_CONT:
    nome, ins, item, coms_pct, premio, total, first_parc = fab
    for offset in range(total - first_parc + 1):
        idx = offset          # todos começam em mai/26 = índice 0
        if idx >= len(MONTHS):
            break
        MESES[MONTHS[idx]].append(
            (nome, ins, item, premio, coms_pct, total, first_parc + offset, total)
        )

for wil in WILSON_NEW:
    nome, ins, item, premio, vezes, mes_ini = wil
    start = MONTH_IDX[mes_ini]
    for offset in range(vezes):
        idx = start + offset
        if idx >= len(MONTHS):
            break
        MESES[MONTHS[idx]].append(
            (nome, ins, item, premio, None, vezes, offset + 1, vezes)
        )

# ---------------------------------------------------------------------------
# ESTILOS
# ---------------------------------------------------------------------------
COR_TITULO    = "1F3864"
COR_MES       = "2E75B6"
COR_BRANCO    = "FFFFFF"
COR_CINZA_CLR = "F2F2F2"
COR_VERDE_CLR = "E2EFDA"
COR_VERM_CLR  = "FFE0E0"
COR_AMAR_CLR  = "FFF2CC"
COR_AZUL_CLR  = "DDEEFF"   # para COM% pré-preenchido (Fabrício)

BORDA_FINA = Border(
    left=Side(style="thin",   color="CCCCCC"), right=Side(style="thin",   color="CCCCCC"),
    top= Side(style="thin",   color="CCCCCC"), bottom=Side(style="thin",  color="CCCCCC"))
BORDA_MES = Border(
    left=Side(style="medium", color=COR_MES),  right=Side(style="medium", color=COR_MES),
    top= Side(style="medium", color=COR_MES),  bottom=Side(style="medium", color=COR_MES))

def fill(cor): return PatternFill("solid", fgColor=cor)

COL_WIDTHS   = [36, 14, 14, 14, 7, 12, 10, 8, 12, 7, 11, 5, 4, 5, 9, 14, 16, 10]
DATA_HEADERS = [
    "PRÊMIO LÍQ", "SEGURADORA", "ITEM", "COM%", "COMISSÃO",
    "26%", "2% DA", "RECEBIDO", "VEZES", "RECEBER",
    "", "DE", "", "AJUSTE", "STATUS", "ADIMPLÊNCIA", "OBS"
]

SHEET_NAME = "COMISSÕES MAI-NOV 26"


# ---------------------------------------------------------------------------
def build_sheet(wb):
    ws = wb.active
    ws.title = SHEET_NAME

    ws.row_dimensions[1].height = 32
    ws.merge_cells("A1:R1")
    c = ws["A1"]
    c.value     = "COMISSÕES QUADRATA SEGUROS  ·  Wilson (novos) + Fabrício (parcelas em aberto)  |  mai/2026 – nov/2026"
    c.font      = Font(name="Calibri", bold=True, size=13, color=COR_BRANCO)
    c.fill      = fill(COR_TITULO)
    c.alignment = Alignment(horizontal="center", vertical="center")

    ws.row_dimensions[2].height = 18
    ws.merge_cells("A2:R2")
    leg = ws["A2"]
    leg.value     = (
        "Fórmulas: COMISSÃO=Prêmio×COM%  |  26%=COM×26%  |  2%DA=26%×2%  |  "
        "RECEBIDO=26%−2%DA  |  RECEBER=RECEBIDO÷VEZES  |  "
        "🟡 COM% amarelo = preencher manualmente (Wilson)  |  🔵 azul = pré-preenchido (Fabrício)"
    )
    leg.font      = Font(name="Calibri", italic=True, size=9, color=COR_BRANCO)
    leg.fill      = fill("2E75B6")
    leg.alignment = Alignment(horizontal="center", vertical="center")

    current_row   = 3
    all_data_rows = []
    month_ranges  = {}

    for mes, linhas in MESES.items():
        ws.row_dimensions[current_row].height = 22
        mc = ws.cell(row=current_row, column=1, value=mes.upper())
        mc.font      = Font(name="Calibri", bold=True, size=10, color=COR_BRANCO)
        mc.fill      = fill(COR_MES)
        mc.alignment = Alignment(horizontal="center", vertical="center")
        mc.border    = BORDA_MES

        for ci, hdr in enumerate(DATA_HEADERS, 2):
            hc = ws.cell(row=current_row, column=ci, value=hdr)
            hc.font      = Font(name="Calibri", bold=True, size=9, color=COR_BRANCO)
            hc.fill      = fill(COR_MES if hdr else "1A5276")
            hc.alignment = Alignment(horizontal="center", vertical="center")
            hc.border    = BORDA_MES

        current_row += 1
        first_data   = current_row

        for i, d in enumerate(linhas):
            (cliente, seg, item, premio, coms_pct, vezes, pnum, ptot) = d
            r   = current_row
            alt = COR_CINZA_CLR if i % 2 == 0 else COR_BRANCO
            ws.row_dimensions[r].height = 16

            def wr(col, val, fmt=None, bold=False, center=False, cor_txt=None, bg=None):
                cell = ws.cell(row=r, column=col, value=val)
                cell.font      = Font(name="Calibri", size=9, bold=bold,
                                      color=cor_txt or "000000")
                cell.fill      = fill(bg or alt)
                cell.border    = BORDA_FINA
                cell.alignment = Alignment(
                    horizontal="center" if center else ("right" if fmt else "left"),
                    vertical="center")
                if fmt:
                    cell.number_format = fmt
                return cell

            wr(1, cliente, bold=True)
            wr(2, premio,  fmt='#,##0.00', cor_txt="1F3864")
            wr(3, seg,     center=True)
            wr(4, item,    center=True)

            # Coluna 5 — COM%
            ce5 = ws.cell(row=r, column=5)
            ce5.border    = BORDA_FINA
            ce5.alignment = Alignment(horizontal="center", vertical="center")
            if coms_pct is not None:
                # Fabrício: valor já conhecido — fundo azul claro
                ce5.value         = coms_pct
                ce5.font          = Font(name="Calibri", size=9, bold=True, color="1F3864")
                ce5.fill          = fill(COR_AZUL_CLR)
                ce5.number_format = '0.0"%"'
            else:
                # Wilson novo: preencher manualmente — fundo amarelo
                ce5.value         = None
                ce5.font          = Font(name="Calibri", size=9, bold=True, color="7F6000")
                ce5.fill          = fill(COR_AMAR_CLR)
                ce5.number_format = '0"%"'

            wr(6,  f"=B{r}*E{r}/100",        fmt='#,##0.00')
            wr(7,  f"=F{r}*0.26",             fmt='#,##0.00')
            wr(8,  f"=G{r}*0.02",             fmt='#,##0.00')
            wr(9,  f"=G{r}-H{r}",             fmt='#,##0.00')
            wr(10, vezes, center=True)
            wr(11, f"=IFERROR(I{r}/J{r},0)",  fmt='#,##0.00')

            last_parc = (pnum == ptot)
            cor_p     = "C00000" if last_parc else "1F3864"
            wr(12, pnum, bold=True, center=True, cor_txt=cor_p)
            wr(13, "DE", center=True)
            wr(14, ptot, bold=True, center=True)
            wr(15, None, fmt='#,##0.00')   # AJUSTE

            sc = ws.cell(row=r, column=16, value="Ativo")
            sc.font      = Font(name="Calibri", bold=True, size=9, color="375623")
            sc.fill      = fill(COR_VERDE_CLR); sc.border = BORDA_FINA
            sc.alignment = Alignment(horizontal="center", vertical="center")

            ac = ws.cell(row=r, column=17, value="Adimplente")
            ac.font      = Font(name="Calibri", bold=True, size=9, color="375623")
            ac.fill      = fill(COR_VERDE_CLR); ac.border = BORDA_FINA
            ac.alignment = Alignment(horizontal="center", vertical="center")

            obs_txt = "DADOS PENDENTES" if premio == 0 else ""
            oc      = ws.cell(row=r, column=18, value=obs_txt)
            oc.fill   = fill(alt); oc.border = BORDA_FINA
            if obs_txt:
                oc.font = Font(name="Calibri", size=9, bold=True, color="C00000")

            all_data_rows.append(r)
            current_row += 1

        last_data            = current_row - 1
        month_ranges[mes]    = (first_data, last_data)

        ws.row_dimensions[current_row].height = 18
        ws.merge_cells(f"A{current_row}:J{current_row}")
        tc = ws[f"A{current_row}"]
        tc.value     = f"TOTAL  {mes.upper()}"
        tc.font      = Font(name="Calibri", bold=True, size=9, color=COR_BRANCO)
        tc.fill      = fill(COR_TITULO)
        tc.alignment = Alignment(horizontal="right", vertical="center")
        tc.border    = BORDA_FINA

        tv = ws.cell(row=current_row, column=11,
                     value=f"=SUM(K{first_data}:K{last_data})")
        tv.font          = Font(name="Calibri", bold=True, size=9, color=COR_BRANCO)
        tv.fill          = fill(COR_TITULO)
        tv.number_format = '#,##0.00'
        tv.alignment     = Alignment(horizontal="right", vertical="center")
        tv.border        = BORDA_FINA
        for ci in range(12, 19):
            ec = ws.cell(row=current_row, column=ci)
            ec.fill = fill(COR_TITULO); ec.border = BORDA_FINA

        current_row += 2

    # Dropdowns e formatação condicional
    if all_data_rows:
        fr, lr = all_data_rows[0], all_data_rows[-1]
        dv_s = DataValidation(type="list", formula1='"Ativo,Inativo"',
                              allow_blank=False, showErrorMessage=True,
                              errorTitle="Inválido", error="Escolha: Ativo ou Inativo")
        dv_s.sqref = f"P{fr}:P{lr}"
        ws.add_data_validation(dv_s)

        dv_a = DataValidation(type="list", formula1='"Adimplente,Inadimplente"',
                              allow_blank=False, showErrorMessage=True,
                              errorTitle="Inválido", error="Escolha: Adimplente ou Inadimplente")
        dv_a.sqref = f"Q{fr}:Q{lr}"
        ws.add_data_validation(dv_a)

        full = f"A{fr}:R{lr}"
        ws.conditional_formatting.add(full, FormulaRule(
            formula=[f'$P{fr}="Inativo"'],
            fill=fill(COR_VERM_CLR),
            font=Font(name="Calibri", size=9, color="C00000")))
        ws.conditional_formatting.add(full, FormulaRule(
            formula=[f'$Q{fr}="Inadimplente"'],
            fill=fill(COR_AMAR_CLR),
            font=Font(name="Calibri", size=9, color="7F6000")))

    for i, w in enumerate(COL_WIDTHS, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A3"

    return month_ranges


# ---------------------------------------------------------------------------
def build_resumo(wb, month_ranges):
    ws = wb.create_sheet("RESUMO MAI-NOV 26")

    ws.row_dimensions[1].height = 30
    ws.merge_cells("A1:G1")
    c = ws["A1"]
    c.value     = "RESUMO — Comissões Quadrata Seguros  |  Wilson + Fabrício  |  mai/2026 – nov/2026"
    c.font      = Font(name="Calibri", bold=True, size=13, color=COR_BRANCO)
    c.fill      = fill(COR_TITULO)
    c.alignment = Alignment(horizontal="center", vertical="center")

    headers = ["MÊS", "Nº ENTRADAS", "TOTAL RECEBER", "SITUAÇÃO", "OBS"]
    ws.row_dimensions[2].height = 20
    for ci, h in enumerate(headers, 1):
        hc = ws.cell(row=2, column=ci, value=h)
        hc.font      = Font(name="Calibri", bold=True, size=10, color=COR_BRANCO)
        hc.fill      = fill(COR_MES)
        hc.alignment = Alignment(horizontal="center", vertical="center")
        hc.border    = BORDA_FINA

    total_rows = []
    for ri, (mes, linhas) in enumerate(MESES.items(), 3):
        ws.row_dimensions[ri].height = 18
        alt = COR_CINZA_CLR if ri % 2 == 0 else COR_BRANCO
        n   = len(linhas)
        sit = "✅ Dados OK" if linhas else "⚠ Aguardando dados"

        c1 = ws.cell(row=ri, column=1, value=mes.upper())
        c1.fill = fill(alt); c1.border = BORDA_FINA
        c1.font = Font(name="Calibri", size=10, bold=True)
        c1.alignment = Alignment(horizontal="center", vertical="center")

        c2 = ws.cell(row=ri, column=2, value=n or "—")
        c2.fill = fill(alt); c2.border = BORDA_FINA
        c2.font = Font(name="Calibri", size=10)
        c2.alignment = Alignment(horizontal="center", vertical="center")

        c3 = ws.cell(row=ri, column=3)
        c3.fill = fill(alt); c3.border = BORDA_FINA
        c3.alignment = Alignment(horizontal="right", vertical="center")
        c3.font = Font(name="Calibri", size=10)
        if mes in month_ranges:
            fr, lr = month_ranges[mes]
            c3.value         = f"=SUM('{SHEET_NAME}'!K{fr}:K{lr})"
            c3.number_format = '#,##0.00'
            total_rows.append(ri)

        c4 = ws.cell(row=ri, column=4, value=sit)
        c4.fill = fill(alt); c4.border = BORDA_FINA
        c4.font = Font(name="Calibri", size=10,
                       color="7F6000" if "Aguardando" in sit else "375623",
                       italic="Aguardando" in sit)
        c4.alignment = Alignment(horizontal="center", vertical="center")

        c5 = ws.cell(row=ri, column=5, value="")
        c5.fill = fill(alt); c5.border = BORDA_FINA

    tr = len(MESES) + 3
    ws.row_dimensions[tr].height = 22
    for ci in range(1, 6):
        tc = ws.cell(row=tr, column=ci)
        tc.fill = fill(COR_TITULO); tc.border = BORDA_FINA
        tc.font = Font(name="Calibri", bold=True, color=COR_BRANCO, size=11)
        tc.alignment = Alignment(horizontal="center" if ci != 3 else "right",
                                  vertical="center")
    ws.cell(row=tr, column=1).value = "TOTAL GERAL"
    if total_rows:
        refs = "+".join(f"C{r}" for r in total_rows)
        ws.cell(row=tr, column=3).value         = f"={refs}"
        ws.cell(row=tr, column=3).number_format = '#,##0.00'
    ws.cell(row=tr, column=4).value = "COM% a preencher (Wilson) / pré-preenchido (Fabrício)"

    for ci, w in enumerate([14, 14, 18, 36, 20], 1):
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.freeze_panes = "A3"


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    wb = openpyxl.Workbook()
    month_ranges = build_sheet(wb)
    build_resumo(wb, month_ranges)
    out = "/home/user/whatsapp-webhook/comissoes_wilson_novos_abr_nov_2026.xlsx"
    wb.save(out)
    print(f"✅  Planilha salva em: {out}")
    # Resumo de entradas por mês
    for m, rows in MESES.items():
        print(f"   {m.upper():8s}  {len(rows):2d} entradas")
