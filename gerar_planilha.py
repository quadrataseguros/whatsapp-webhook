#!/usr/bin/env python3
"""Planilha de Comissões Wilson - Quadrata Seguros  |  Vigência: 23/04/2025 – 23/04/2026"""
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

# Tuple: (cliente, seguradora, item, premio, coms%, vezes, parc_num, parc_total)

MESES = {
    "abr/25": [
        ("LEIDE DAYANE DE SOUZA","SUHAI","TORO",2985.74,25,12,12,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4099.42,10,10,10,10),
        ("CRISTIANE DOS SANTOS COSTA SILVA","ALLIANZ","ONIX",2023.63,20,10,8,10),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1786.77,20,10,8,10),
        ("LUIZ ANTONIO DE CARVALHO","AZUL","SANDERO",1669.87,20,10,6,10),
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,6,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",4210.75,15,10,6,10),
        ("CHRISTIAN DO NASCIMENTO","TOKIO MARINE","TIGGO",2320.42,20,5,5,5),
        ("CLAUDEMAR RAIMUNDO DO NASCIMENTO","PORTO","ONIX",1839.91,20,10,5,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,5,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,5,12),
        ("JONATAS DE BRITO LUCAS","TOKIO MARINE","VERSA",2121.51,20,7,4,7),
        ("PAULO SERGIO LADUANO","TOKIO MARINE","COROLLA",1790.54,20,5,4,5),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,4,8),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,3,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,3,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,3,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,3,12),
        ("ROSANGELA DE JESUS MELO","SUHAI","IDEA",1454.42,25,1,1,1),
    ],
    "mai/25": [],
    "jun/25": [
        ("LEIDE DAYANE DE SOUZA","SUHAI","TORO",2985.74,25,12,12,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4099.42,10,10,10,10),
        ("CRISTIANE DOS SANTOS COSTA SILVA","ALLIANZ","ONIX",2023.63,20,10,8,10),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1786.77,20,10,8,10),
        ("LUIZ ANTONIO DE CARVALHO","AZUL","SANDERO",1669.87,20,10,6,10),
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,6,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",4210.75,15,10,6,10),
        ("CHRISTIAN DO NASCIMENTO","TOKIO MARINE","TIGGO",2320.42,20,5,5,5),
        ("CLAUDEMAR RAIMUNDO DO NASCIMENTO","PORTO","ONIX",1839.91,20,10,5,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,5,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,5,12),
        ("JONATAS DE BRITO LUCAS","TOKIO MARINE","VERSA",2121.51,20,7,4,7),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,4,8),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,3,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,3,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,3,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,3,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,1,10),
        ("JOSE NILTON DOS SANTOS","PORTO","HR-V",2256.38,20,4,1,4),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,1,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,1,12),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",144.04,20,1,1,1),
    ],
    "jul/25": [
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4099.42,10,10,10,10),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1786.77,20,10,8,10),
        ("LUIZ ANTONIO DE CARVALHO","AZUL","SANDERO",1669.87,20,10,9,10),
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,6,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",4210.75,15,10,6,10),
        ("CHRISTIAN DO NASCIMENTO","TOKIO MARINE","TIGGO",2320.42,20,5,5,5),
        ("CLAUDEMAR RAIMUNDO DO NASCIMENTO","PORTO","ONIX",1839.91,20,10,5,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,5,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,5,12),
        ("JONATAS DE BRITO LUCAS","TOKIO MARINE","VERSA",2121.51,20,7,7,7),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,4,8),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,3,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,3,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,3,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,3,12),
        ("ROSANGELA DE JESUS MELO","SUHAI","IDEA",1454.42,25,1,1,1),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,2,10),
        ("JOSE NILTON DOS SANTOS","PORTO","HR-V",2256.38,20,4,2,4),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,2,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,2,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,1,10),
        ("DERANILDA PEREIRA COELHO","SUHAI","ZARIFA",1553.27,20,5,1,5),
        ("IVO REIS DO NASCIMENTO","AZUL","CITY SEDAN",1199.51,20,1,1,1),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,1,12),
    ],
    "ago/25": [
        ("LUIZ ANTONIO DE CARVALHO","AZUL","SANDERO",1669.87,20,10,10,10),
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,8,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",4210.75,15,10,10,10),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,8,12),
        ("CLAUDEMAR RAIMUNDO DO NASCIMENTO","PORTO","ONIX",1839.91,20,10,7,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,7,12),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,8,8),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,5,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,5,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,5,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,5,12),
        ("ROSANGELA DE JESUS MELO","SUHAI","IDEA",1454.42,25,1,1,1),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,3,10),
        ("JOSE NILTON DOS SANTOS","PORTO","HR-V",2256.38,20,4,3,4),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,3,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,3,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,2,10),
        ("DERANILDA PEREIRA COELHO","SUHAI","ZARIFA",1553.27,20,5,2,5),
        ("IVO REIS DO NASCIMENTO","AZUL","CITY SEDAN",1199.51,20,1,1,1),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,2,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,1,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,1,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","TRACKER",326.96,20,3,1,3),
    ],
    "set/25": [
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,9,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,10,12),
        ("CLAUDEMAR RAIMUNDO DO NASCIMENTO","PORTO","ONIX",1839.91,20,10,10,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,8,12),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,8,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,8,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,10,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,6,12),
        ("ROSANGELA DE JESUS MELO","SUHAI","IDEA",1454.42,25,1,1,1),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,4,10),
        ("JOSE NILTON DOS SANTOS","PORTO","HR-V",2256.38,20,4,4,4),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,4,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,4,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,3,10),
        ("DERANILDA PEREIRA COELHO","SUHAI","ZARIFA",1553.27,20,5,3,5),
        ("IVO REIS DO NASCIMENTO","AZUL","CITY SEDAN",1199.51,20,1,1,1),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,3,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,2,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,2,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","TRACKER",326.96,20,3,2,3),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,2,10),
    ],
    "out/25": [
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,10,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,11,12),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,9,12),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,9,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,9,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,11,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,7,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,5,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,5,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,5,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,4,10),
        ("DERANILDA PEREIRA COELHO","SUHAI","ZARIFA",1553.27,20,5,4,5),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,4,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,3,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,3,10),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","TRACKER",326.96,20,3,3,3),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,3,10),
        ("ROSANGELA DE JESUS MELO","SUHAI","IDEA",1454.42,25,4,1,4),
        ("IVO REIS DO NASCIMENTO","AZUL","CITY SEDAN",1199.51,20,3,1,3),
    ],
    "nov/25": [
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,11,12),
        ("ROBSON NASCIMENTO SANTOS","SUHAI","CITY",3329.52,15,12,12,12),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,10,12),
        ("RAFAEL SANTOS NASCIMENTO","AZUL","CIVIC",3336.34,20,10,10,10),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",1029.05,20,10,10,10),
        ("FRANCISCO FERNANDES DE LIMA","TOKIO MARINE","CITY",1613.57,20,12,12,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,8,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,6,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,6,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,6,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,5,10),
        ("DERANILDA PEREIRA COELHO","SUHAI","ZARIFA",1553.27,20,5,5,5),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,5,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,4,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,4,10),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,4,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,1,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,1,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,1,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,1,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,1,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,1,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,1,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,1,6),
    ],
    "dez/25": [
        ("JULIO CESAR ALMEIDA DE OLIVEIRA","TOKIO MARINE","I30",2089.08,20,12,12,12),
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,11,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,9,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,7,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,7,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,7,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,6,10),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,6,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,5,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,5,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,2,12),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,5,10),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,2,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,2,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,2,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,2,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,2,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,2,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,1,6),
        ("JONATAS DE BRITO LUCAS","ALIRO","VERSA",2253.12,14,1,1,1),
        ("PAULO SERGIO LADUANO","HDI","COROLLA",1853.86,20,6,1,6),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,1,8),
        ("FABIO FRANCISCO DA SILVA","SUHAI","XTZ 250",651.42,20,7,1,7),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CIVIC",1048.71,10,12,1,12),
    ],
    "jan/26": [
        ("FRANCISCO FERNANDES DE LIMA","ALIRO","CRETA",1752.74,20,12,12,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,10,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,8,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,8,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,8,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,7,10),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,7,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,6,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,6,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,3,12),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,6,10),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,3,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,3,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,3,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,3,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,3,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,3,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,2,6),
        ("PAULO SERGIO LADUANO","HDI","COROLLA",1853.86,20,6,2,6),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,2,8),
        ("FABIO FRANCISCO DA SILVA","SUHAI","XTZ 250",651.42,20,7,2,7),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CIVIC",1048.71,10,12,2,12),
    ],
    "fev/26": [
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,11,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,9,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,9,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,9,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,8,10),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,8,12),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,7,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,7,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,4,12),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,7,10),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,4,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,4,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,4,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,4,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,4,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,4,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,3,6),
        ("PAULO SERGIO LADUANO","HDI","COROLLA",1853.86,20,6,3,6),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,3,8),
        ("FABIO FRANCISCO DA SILVA","SUHAI","XTZ 250",651.42,20,7,3,7),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CIVIC",1048.71,10,12,3,12),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",920.16,20,10,1,10),
    ],
    "mar/26": [
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30",1602.96,20,12,12,12),
        ("ANTONIO CARLOS DOS SANTOS","PORTO","TUCSON",2201.31,18,10,10,10),
        ("OTAVIANO DE JESUS","PORTO","CORSA",1854.88,18,10,10,10),
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,10,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,9,10),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,9,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,8,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,5,12),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,8,10),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,8,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,5,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,5,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,5,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,5,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,5,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,5,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,4,6),
        ("PAULO SERGIO LADUANO","HDI","COROLLA",1853.86,20,6,4,6),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,4,8),
        ("FABIO FRANCISCO DA SILVA","SUHAI","XTZ 250",651.42,20,7,4,7),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",920.16,20,10,2,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CIVIC",1048.71,10,12,4,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30 NOVA",1537.17,25,12,1,12),
    ],
    "abr/26": [
        ("LEONARDO VAZ DE FREITAS","SUHAI","TUCSON",1689.84,25,12,11,12),
        ("VALDISLEI XAVIER DO NASCIMENTO","BRADESCO","COROLLA",4204.31,20,10,10,10),
        ("ANDREA NASC. SANTANA MARTIENA","TOKIO MARINE","CRETA",1986.95,20,12,10,12),
        ("IVO REIS DO NASCIMENTO","MITSUI","FOX",2141.74,20,10,9,10),
        ("LEIDE DAYANE DE SOUZA","SUHAI","SUZUKI",1835.77,22,12,6,12),
        ("LEIDE DAYANE DE SOUZA","ALIRO","ECOSPORT",1642.98,20,10,9,10),
        ("CAIO CESAR DOS SANTOS","SUHAI","SIENA",3310.55,20,12,9,12),
        ("SOLENIR GOMES DA SILVA MANCINI","AZUL","JETTA",5228.34,20,10,6,10),
        ("JURANDIR FERREIRA DOS SANTOS","TOKIO MARINE","GOL",1313.13,20,6,6,6),
        ("LUIZ ANTONIO DE CARVALHO","BRADESCO","SANDERO",1547.32,20,6,6,6),
        ("LEIDE DAYANE DE SOUZA","ALIRO","COMPASS",3390.27,20,10,6,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CITY",1620.86,10,12,6,12),
        ("JOSE MARIA COELHO","ZURICH","T-CROSS",3529.48,20,12,6,12),
        ("CHRISTIAN DO NASCIMENTO","AZUL","TIGGO",1559.48,20,6,5,6),
        ("PAULO SERGIO LADUANO","HDI","COROLLA",1853.86,20,6,5,6),
        ("LUIZ ANTONIO DE CARVALHO","SUHAI","SPORTAGE",1640.47,20,8,5,8),
        ("FABIO FRANCISCO DA SILVA","SUHAI","XTZ 250",651.42,20,7,5,7),
        ("ELIZABETH IZAGUIRRE GOMES","HDI","PALIO",920.16,20,10,3,10),
        ("WILSON FRANCISCO NASCIMENTO","SUHAI","CIVIC",1048.71,10,12,5,12),
        ("SOLANGE SILVA DE JESUS","TOKIO MARINE","I30 NOVA",1537.17,25,12,2,12),
    ],
}

# ---------------------------------------------------------------------------
COR_TITULO    = "1F3864"
COR_MES       = "2E75B6"
COR_BRANCO    = "FFFFFF"
COR_CINZA_CLR = "F2F2F2"
COR_VERDE_CLR = "E2EFDA"
COR_VERM_CLR  = "FFE0E0"
COR_AMAR_CLR  = "FFF2CC"

BORDA_FINA = Border(
    left=Side(style="thin",color="CCCCCC"), right=Side(style="thin",color="CCCCCC"),
    top=Side(style="thin",color="CCCCCC"),  bottom=Side(style="thin",color="CCCCCC"))
BORDA_MES = Border(
    left=Side(style="medium",color=COR_MES), right=Side(style="medium",color=COR_MES),
    top=Side(style="medium",color=COR_MES),  bottom=Side(style="medium",color=COR_MES))

def fill(cor): return PatternFill("solid", fgColor=cor)

COL_WIDTHS = [32,14,13,11,7,12,10,8,12,7,11,5,4,5,9,14,16,10]
DATA_HEADERS = [
    "PRÊMIO LÍQ","SEGURADORA","ITEM","COM%","COMISSÃO",
    "26%","2% DA","RECEBIDO","VEZES","RECEBER",
    "","DE","","AJUSTE","STATUS","ADIMPLÊNCIA","OBS"
]

# ---------------------------------------------------------------------------
def build_sheet(wb):
    ws = wb.active
    ws.title = "COMISSÕES WILSON"

    ws.row_dimensions[1].height = 32
    ws.merge_cells("A1:R1")
    c = ws["A1"]
    c.value = "COMISSÃO WILSON  ·  QUADRATA SEGUROS  |  Vigência: 23/04/2025 – 23/04/2026  |  Pagamento: 24/04/2026"
    c.font  = Font(name="Calibri", bold=True, size=13, color=COR_BRANCO)
    c.fill  = fill(COR_TITULO)
    c.alignment = Alignment(horizontal="center", vertical="center")

    ws.row_dimensions[2].height = 18
    ws.merge_cells("A2:R2")
    leg = ws["A2"]
    leg.value = "Fórmulas: COMISSÃO=Prêmio×COM%  |  26%=COM×26%  |  2%DA=26%×2%  |  RECEBIDO=26%−2%DA  |  RECEBER=RECEBIDO÷VEZES"
    leg.font      = Font(name="Calibri", italic=True, size=9, color=COR_BRANCO)
    leg.fill      = fill("2E75B6")
    leg.alignment = Alignment(horizontal="center", vertical="center")

    current_row = 3
    all_data_rows = []
    month_ranges = {}

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

        if not linhas:
            ws.row_dimensions[current_row].height = 16
            ws.merge_cells(f"A{current_row}:R{current_row}")
            ac = ws[f"A{current_row}"]
            ac.value     = f"⚠  Dados de {mes} ainda não inseridos — preencher manualmente"
            ac.font      = Font(name="Calibri", italic=True, size=9, color="7F6000")
            ac.fill      = fill(COR_AMAR_CLR)
            ac.alignment = Alignment(horizontal="center")
            current_row += 2
            continue

        first_data = current_row
        for i, d in enumerate(linhas):
            (cliente, seg, item, premio, cpct, vezes, pnum, ptot) = d
            r = current_row
            ws.row_dimensions[r].height = 16
            alt = COR_CINZA_CLR if i % 2 == 0 else COR_BRANCO

            def wr(col, val, fmt=None, bold=False, center=False, cor_txt=None, bg=None):
                cell = ws.cell(row=r, column=col, value=val)
                cell.font   = Font(name="Calibri", size=9, bold=bold, color=cor_txt or "000000")
                cell.fill   = fill(bg or alt)
                cell.border = BORDA_FINA
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
            wr(5, cpct,    fmt='0"%"', center=True)
            wr(6, f"=B{r}*E{r}/100", fmt='#,##0.00')
            wr(7, f"=F{r}*0.26",     fmt='#,##0.00')
            wr(8, f"=G{r}*0.02",     fmt='#,##0.00')
            wr(9, f"=G{r}-H{r}",     fmt='#,##0.00')
            wr(10, vezes, center=True)
            wr(11, f"=IFERROR(I{r}/J{r},0)", fmt='#,##0.00')

            last_parc = (pnum == ptot)
            cor_p = "C00000" if last_parc else "1F3864"
            wr(12, pnum, bold=True, center=True, cor_txt=cor_p)
            wr(13, "DE", center=True)
            wr(14, ptot, bold=True, center=True)
            wr(15, None, fmt='#,##0.00')

            sc = ws.cell(row=r, column=16, value="Ativo")
            sc.font = Font(name="Calibri", bold=True, size=9, color="375623")
            sc.fill = fill(COR_VERDE_CLR); sc.border = BORDA_FINA
            sc.alignment = Alignment(horizontal="center", vertical="center")

            ac2 = ws.cell(row=r, column=17, value="Adimplente")
            ac2.font = Font(name="Calibri", bold=True, size=9, color="375623")
            ac2.fill = fill(COR_VERDE_CLR); ac2.border = BORDA_FINA
            ac2.alignment = Alignment(horizontal="center", vertical="center")

            oc = ws.cell(row=r, column=18, value="")
            oc.fill = fill(alt); oc.border = BORDA_FINA

            all_data_rows.append(r)
            current_row += 1

        last_data = current_row - 1
        month_ranges[mes] = (first_data, last_data)

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

    # Dropdowns & conditional formatting
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
    ws = wb.create_sheet("RESUMO MENSAL")

    ws.row_dimensions[1].height = 30
    ws.merge_cells("A1:G1")
    c = ws["A1"]
    c.value     = "RESUMO MENSAL — COMISSÕES WILSON  |  Vigência 23/04/2025 – 23/04/2026  |  Pagamento: 24/04/2026"
    c.font      = Font(name="Calibri", bold=True, size=13, color=COR_BRANCO)
    c.fill      = fill(COR_TITULO)
    c.alignment = Alignment(horizontal="center", vertical="center")

    headers = ["MÊS","Nº CLIENTES","TOTAL RECEBER","SITUAÇÃO","OBS"]
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
        n = len(linhas)
        sit = "✅ Dados OK" if linhas else "⚠ Aguardando dados"

        ws.cell(row=ri, column=1, value=mes.upper()).fill = fill(alt)
        ws.cell(row=ri, column=1).font   = Font(name="Calibri", size=10, bold=True)
        ws.cell(row=ri, column=1).border = BORDA_FINA
        ws.cell(row=ri, column=1).alignment = Alignment(horizontal="center", vertical="center")

        ws.cell(row=ri, column=2, value=n or "—").fill = fill(alt)
        ws.cell(row=ri, column=2).font   = Font(name="Calibri", size=10)
        ws.cell(row=ri, column=2).border = BORDA_FINA
        ws.cell(row=ri, column=2).alignment = Alignment(horizontal="center", vertical="center")

        c3 = ws.cell(row=ri, column=3)
        c3.fill = fill(alt); c3.border = BORDA_FINA
        c3.alignment = Alignment(horizontal="right", vertical="center")
        c3.font = Font(name="Calibri", size=10)
        if mes in month_ranges:
            fr, lr = month_ranges[mes]
            c3.value = f"=SUM('COMISSÕES WILSON'!K{fr}:K{lr})"
            c3.number_format = '#,##0.00'
            total_rows.append(ri)
        else:
            c3.value = None

        c4 = ws.cell(row=ri, column=4, value=sit)
        c4.fill = fill(alt); c4.border = BORDA_FINA
        c4.font = Font(name="Calibri", size=10,
                       color="7F6000" if "Aguardando" in sit else "375623",
                       italic="Aguardando" in sit)
        c4.alignment = Alignment(horizontal="center", vertical="center")

        c5 = ws.cell(row=ri, column=5, value="")
        c5.fill = fill(alt); c5.border = BORDA_FINA

    # Grand total
    tr = len(MESES) + 3
    ws.row_dimensions[tr].height = 22
    for ci in range(1, 6):
        tc = ws.cell(row=tr, column=ci)
        tc.fill = fill(COR_TITULO); tc.border = BORDA_FINA
        tc.font = Font(name="Calibri", bold=True, color=COR_BRANCO, size=11)
        tc.alignment = Alignment(horizontal="center" if ci != 3 else "right", vertical="center")
    ws.cell(row=tr, column=1).value = "TOTAL GERAL"
    if total_rows:
        refs = "+".join(f"C{r}" for r in total_rows)
        ws.cell(row=tr, column=3).value = f"={refs}"
        ws.cell(row=tr, column=3).number_format = '#,##0.00'
    ws.cell(row=tr, column=4).value = "Pagamento: 24/04/2026"

    for ci, w in enumerate([14, 14, 18, 20, 20], 1):
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.freeze_panes = "A3"


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    wb = openpyxl.Workbook()
    month_ranges = build_sheet(wb)
    build_resumo(wb, month_ranges)
    out = "/home/user/whatsapp-webhook/comissoes_wilson_2025_26.xlsx"
    wb.save(out)
    print(f"✅  Planilha salva em: {out}")
