import unittest
from datetime import date
from app.domain.projects.excel_parser import parse_date

class TestExcelParser(unittest.TestCase):
    def test_parse_date_brazilian_format(self):
        # 4-digit years
        self.assertEqual(parse_date("02/04/2026"), date(2026, 4, 2))
        self.assertEqual(parse_date("16/06/2026"), date(2026, 6, 16))
        # 2-digit years
        self.assertEqual(parse_date("02/04/26"), date(2026, 4, 2))
        self.assertEqual(parse_date("16/06/26"), date(2026, 6, 16))

    def test_parse_date_dashes(self):
        # 4-digit years
        self.assertEqual(parse_date("02-04-2026"), date(2026, 4, 2))
        self.assertEqual(parse_date("16-06-2026"), date(2026, 6, 16))
        # 2-digit years
        self.assertEqual(parse_date("02-04-26"), date(2026, 4, 2))
        self.assertEqual(parse_date("16-06-26"), date(2026, 6, 16))

    def test_parse_date_iso(self):
        self.assertEqual(parse_date("2026-04-02"), date(2026, 4, 2))
        self.assertEqual(parse_date("2026/04/02"), date(2026, 4, 2))

    def test_parse_date_invalid_and_none(self):
        self.assertIsNone(parse_date(None))
        self.assertIsNone(parse_date("invalid-date"))
        self.assertIsNone(parse_date("32/13/2026"))

    def test_parse_date_with_format_suffix(self):
        self.assertEqual(parse_date("12/08/26 DD-MM-YYYY"), date(2026, 8, 12))
        self.assertEqual(parse_date("12/08/26 DD/MM/YYYY"), date(2026, 8, 12))
        self.assertEqual(parse_date("04/08/2026 DD-MM-YYYY"), date(2026, 8, 4))

if __name__ == "__main__":
    unittest.main()
