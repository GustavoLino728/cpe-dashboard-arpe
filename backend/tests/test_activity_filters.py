import unittest
from datetime import date

from app.domain.projects.activity_filters import (
    classify_effective_status,
    clean_executor_label,
    escape_like_term,
    fold_accents,
    matches_period_scope,
    normalize_status_filter_key,
    parse_month_bounds,
    resolve_period_bounds,
    summarize_activity_kpis,
)


class TestActivityFiltersDomain(unittest.TestCase):
    def test_parse_month_bounds_supports_iso_br_and_leap_year(self):
        self.assertIsNone(parse_month_bounds(None))
        self.assertIsNone(parse_month_bounds("   "))
        self.assertEqual(parse_month_bounds("2026-04"), (date(2026, 4, 1), date(2026, 4, 30)))
        self.assertEqual(parse_month_bounds("02/2024"), (date(2024, 2, 1), date(2024, 2, 29)))
        self.assertEqual(parse_month_bounds("2026-02"), (date(2026, 2, 1), date(2026, 2, 28)))

        with self.assertRaises(ValueError):
            parse_month_bounds("2026-13")
        with self.assertRaises(ValueError):
            parse_month_bounds("abril")

    def test_resolve_period_bounds_rejects_inverted_range(self):
        self.assertEqual(
            resolve_period_bounds("2026-04", "11/2026"),
            (date(2026, 4, 1), date(2026, 11, 30)),
        )
        self.assertEqual(resolve_period_bounds("2026-04", None), (date(2026, 4, 1), None))
        self.assertEqual(resolve_period_bounds(None, "2026-11"), (None, date(2026, 11, 30)))

        with self.assertRaises(ValueError):
            resolve_period_bounds("2026-11", "2026-04")

    def test_escape_like_term_and_accent_folding(self):
        self.assertEqual(escape_like_term("50%_meta\\a"), "50\\%\\_meta\\\\a")
        self.assertEqual(
            fold_accents("Filtros de Água Recebidos — Concessão"),
            "filtros de agua recebidos — concessao",
        )

    def test_clean_executor_label_and_status_filter_normalization(self):
        self.assertEqual(clean_executor_label("ARPE (DSAN)"), "DSAN")
        self.assertEqual(clean_executor_label("  CCPE "), "CCPE")
        self.assertEqual(clean_executor_label(None), "")

        self.assertIsNone(normalize_status_filter_key("todos"))
        self.assertEqual(normalize_status_filter_key("Concluído"), "ok")
        self.assertEqual(normalize_status_filter_key("Em andamento"), "warn")
        self.assertEqual(normalize_status_filter_key("A Iniciar"), "pending")
        self.assertEqual(normalize_status_filter_key("pending"), "pending")
        self.assertEqual(normalize_status_filter_key("Atrasado"), "late")

    def test_summarize_activity_kpis_counts_all_five_buckets(self):
        result = summarize_activity_kpis(
            ["Concluído", "Atrasado", "Em andamento", "A Iniciar", "A Iniciar"]
        )
        self.assertEqual(
            result,
            {
                "total": 5,
                "concluidas": 1,
                "atrasadas": 1,
                "em_andamento": 1,
                "a_iniciar": 2,
            },
        )

    def test_classify_effective_status_rn01_rules(self):
        ref = date(2026, 11, 26)
        self.assertEqual(classify_effective_status(None, None, ref), "A Iniciar")
        self.assertEqual(classify_effective_status("   ", date(2026, 12, 10), ref), "A Iniciar")
        self.assertEqual(classify_effective_status("A Iniciar", date(2026, 11, 1), ref), "Atrasado")
        self.assertEqual(classify_effective_status("Em andamento", date(2026, 12, 1), ref), "Em andamento")
        self.assertEqual(classify_effective_status("Em andamento", date(2026, 11, 20), ref), "Atrasado")
        self.assertEqual(classify_effective_status("Concluído", date(2025, 1, 1), ref), "Concluído")

    def test_matches_period_scope_rn04_with_closed_and_open_intervals(self):
        p_start = date(2026, 4, 1)
        p_end = date(2026, 11, 30)

        self.assertTrue(matches_period_scope(None, None, None, None))
        self.assertFalse(matches_period_scope(None, None, p_start, p_end))

        # Acao A: terminou antes do recorte -> False
        self.assertFalse(matches_period_scope(date(2026, 1, 10), date(2026, 3, 20), p_start, p_end))
        # Acao B: cruza o inicio do recorte -> True
        self.assertTrue(matches_period_scope(date(2026, 2, 1), date(2026, 5, 15), p_start, p_end))
        # Acao C: vigencia aberta [2026-02-01, +inf) sem prazo final -> True
        self.assertTrue(matches_period_scope(date(2026, 2, 1), None, p_start, p_end))
        # Acao D: vigencia aberta com inicio depois do fim do recorte -> False
        self.assertFalse(matches_period_scope(date(2026, 12, 5), None, p_start, p_end))
        # Sem start_date, apenas deadline dentro e fora do recorte
        self.assertTrue(matches_period_scope(None, date(2026, 6, 15), p_start, p_end))
        self.assertFalse(matches_period_scope(None, date(2026, 12, 1), p_start, p_end))

        # Apenas period_start informado
        self.assertTrue(matches_period_scope(date(2026, 2, 1), None, p_start, None))
        self.assertTrue(matches_period_scope(None, date(2026, 5, 1), p_start, None))
        self.assertFalse(matches_period_scope(date(2026, 1, 1), date(2026, 3, 31), p_start, None))

        # Apenas period_end informado
        self.assertTrue(matches_period_scope(date(2026, 2, 1), date(2026, 12, 31), None, p_end))
        self.assertFalse(matches_period_scope(date(2026, 12, 5), None, None, p_end))


if __name__ == "__main__":
    unittest.main()
