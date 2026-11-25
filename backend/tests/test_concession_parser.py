import unittest
from datetime import date

from app.domain.projects.concession_parser import (
    build_concession_header_map,
    normalize_concession_status,
    normalize_mrae,
    normalize_periodicity,
    normalize_responsible,
    parse_concession_sheet,
    parse_hybrid_date,
    split_executors,
)


LIVE_LIKE_HEADER = [
    "MRAE",
    "Instrumento",
    "Cláusula",
    "Fase",
    "Grupos temáticos",
    "Ação",
    "Natureza",
    "Etapa prévia",
    "Prazo da etapa prévia",
    "Responsável",
    "Executor (áreas da ARPE)",
    "Prazo contratual da ARPE",
    "Periodicidade",
    "Prazo inicial",
    "Mês inicial",
    "Ano inicial",
    "Prazo final",
    "Mês final",
    "Ano final",
    "Prazo inicial realizado ",
    "Prazo final realizado",
    "Status da ação",
    "Observações",
    "SEI",
    "Resumo DO OBJETO",
    "Data de entrada da ARPE",
    "Data de final da ARPE",
    "Status",
    "SEI",
    "Resumo",
]


class TestConcessionParser(unittest.TestCase):
    def test_normalizers_clean_spaces_case_and_empty_status(self):
        self.assertEqual(normalize_mrae("  MRAE - I "), "MRAE - I")
        self.assertEqual(normalize_mrae("MRAE-II"), "MRAE - II")
        self.assertEqual(normalize_concession_status(None), "A Iniciar")
        self.assertEqual(normalize_concession_status("   "), "A Iniciar")
        self.assertEqual(normalize_concession_status("A Iniciar"), "A Iniciar")
        self.assertEqual(normalize_concession_status("Em andamento"), "Em andamento")
        self.assertEqual(normalize_concession_status("Concluído"), "Concluído")
        self.assertEqual(normalize_responsible("VERIFICADOR INDEPENDENTE."), "Verificador Independente")
        self.assertEqual(normalize_responsible("CONCESSIONÁRIA"), "Concessionária")
        self.assertEqual(normalize_responsible("ARPE"), "ARPE")
        self.assertEqual(normalize_periodicity("anual"), "Anual")
        self.assertEqual(normalize_periodicity("Único"), "Única")

    def test_split_executors_handles_slashes_and_word_e_without_breaking_de(self):
        self.assertEqual(split_executors("DSAN/ CCPE"), ["DSAN", "CCPE"])
        self.assertEqual(split_executors("DSAN e DPRES"), ["DSAN", "DPRES"])
        self.assertEqual(
            split_executors("Membros ARPE do Comitê de Transição"),
            ["Membros ARPE do Comitê de Transição"],
        )
        self.assertIsNone(split_executors("   "))

    def test_parse_hybrid_date_separates_dates_from_text_rules(self):
        self.assertEqual(parse_hybrid_date("02/04/2026"), (date(2026, 4, 2), None))
        self.assertEqual(parse_hybrid_date("Não se aplica"), (None, "Não se aplica"))
        self.assertEqual(parse_hybrid_date("90 dias"), (None, "90 dias"))
        self.assertEqual(parse_hybrid_date("   "), (None, None))

    def test_header_map_handles_duplicate_sei_and_rejects_missing_required(self):
        col_map = build_concession_header_map(LIVE_LIKE_HEADER)
        self.assertEqual(col_map["sei_number"], 23)
        self.assertEqual(col_map["sei_2"], 28)
        self.assertEqual(col_map["arpe_status"], 27)
        self.assertEqual(col_map["status"], 21)

        with self.assertRaises(ValueError):
            build_concession_header_map(["Instrumento", "Cláusula"])

    def test_parse_concession_sheet_handles_ragged_rows_null_status_and_duplicates(self):
        rows = [
            LIVE_LIKE_HEADER,
            [
                "MRAE - I ",
                "Contrato de Concessão",
                "2.3.1",
                "Transição + Operação",
                "Normas",
                "Observar resoluções",
                "Condicionada",
                "      ",
                "Não se aplica",
                "CONCESSIONÁRIA",
                "DSAN/DEF",
                "35 anos",
                "anual",
                "02/04/2026",
                "",
                "",
                "Não se aplica",
            ],
            [],
            [
                "MRAE - I",
                "Contrato de Concessão",
                "2.3.1",
                "Transição + Operação",
                "Normas",
                "Observar resoluções",
                "Condicionada",
                "Não se aplica",
                "90 dias",
                "ARPE",
                "DSAN e DPRES",
                "35 anos",
                "Por demanda",
                "Não se aplica",
                "",
                "",
                "23/11/2026",
                "",
                "",
                "",
                "",
                "",
                "Filtros de água recebidos",
                "0030215479/2026",
                "",
                "",
                "",
                "",
                "SEI-SEC-01",
                "Resumo teste",
            ],
        ]

        parsed = parse_concession_sheet(rows)
        self.assertEqual(len(parsed), 2)

        first, second = parsed
        self.assertEqual(first["mrae"], "MRAE - I")
        self.assertEqual(first["status"], "A Iniciar")
        self.assertIsNone(first["prior_step"])
        self.assertEqual(first["start_date"], date(2026, 4, 2))
        self.assertIsNone(first["deadline"])
        self.assertEqual(first["final_deadline_text"], "Não se aplica")
        self.assertEqual(first["department"], ["DSAN", "DEF"])
        self.assertEqual(first["periodicity"], "Anual")

        self.assertEqual(second["status"], "A Iniciar")
        self.assertEqual(second["department"], ["DSAN", "DPRES"])
        self.assertEqual(second["deadline"], date(2026, 11, 23))
        self.assertEqual(second["sei_number"], "0030215479/2026")
        self.assertEqual(second["sei_2"], "SEI-SEC-01")
        self.assertEqual(second["summary"], "Resumo teste")
        self.assertNotEqual(first["source_row_key"], second["source_row_key"])


if __name__ == "__main__":
    unittest.main()
