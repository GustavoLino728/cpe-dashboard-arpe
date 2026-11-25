import json
import unittest
from unittest.mock import MagicMock, patch

from app.domain.projects.google_sheets_client import (
    GoogleSheetsClient,
    extract_spreadsheet_id,
    normalize_sheet_title,
)


class TestGoogleSheetsClient(unittest.TestCase):
    def test_extract_spreadsheet_id_from_full_url_and_raw_id(self):
        url = "https://docs.google.com/spreadsheets/d/1AWXMSjpBb8lTSyqXzJYfoRm5gJAEXn4S/edit?usp=sharing"
        self.assertEqual(extract_spreadsheet_id(url), "1AWXMSjpBb8lTSyqXzJYfoRm5gJAEXn4S")
        self.assertEqual(extract_spreadsheet_id("  abc123_XYZ  "), "abc123_XYZ")

    def test_normalize_sheet_title_ignores_accents_case_and_whitespace(self):
        self.assertEqual(normalize_sheet_title("  Concessão "), "CONCESSAO")

    def test_raises_file_not_found_when_no_credentials_or_api_key(self):
        client = GoogleSheetsClient(
            credentials_file="arquivo_inexistente.json",
            credentials_json=None,
            api_key=None,
        )
        with self.assertRaises(FileNotFoundError):
            client.read_sheet_rows("sheet-123", "Concessão")

    @patch("app.domain.projects.google_sheets_client.build")
    def test_uses_api_key_and_reads_concessao_sheet_with_quotes(self, mock_build):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_service.spreadsheets.return_value.get.return_value.execute.return_value = {
            "sheets": [
                {"properties": {"title": "Análise"}},
                {"properties": {"title": "Concessão "}},
            ]
        }
        expected_rows = [
            ["MRAE", "Instrumento", "Ação"],
            ["MRAE - I ", "Contrato de Concessão", "Fiscalizar"],
        ]
        mock_service.spreadsheets.return_value.values.return_value.get.return_value.execute.return_value = {
            "values": expected_rows
        }

        client = GoogleSheetsClient(
            credentials_file="nao_existe.json",
            credentials_json=None,
            api_key="AIzaSyFakeKeyParaTeste123",
        )
        title, rows = client.read_sheet_rows("sheet-123", "Concessão")

        mock_build.assert_called_once_with(
            "sheets", "v4", developerKey="AIzaSyFakeKeyParaTeste123"
        )
        mock_service.spreadsheets.return_value.values.return_value.get.assert_called_once_with(
            spreadsheetId="sheet-123",
            range="'Concessão '",
        )
        self.assertEqual(title, "Concessão ")
        self.assertEqual(rows, expected_rows)

    @patch("app.domain.projects.google_sheets_client.service_account.Credentials.from_service_account_info")
    @patch("app.domain.projects.google_sheets_client.build")
    def test_prefers_service_account_over_api_key(self, mock_build, mock_sa_info):
        fake_creds = MagicMock()
        mock_sa_info.return_value = fake_creds
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_service.spreadsheets.return_value.get.return_value.execute.return_value = {
            "sheets": [{"properties": {"title": "Concessão"}}]
        }
        mock_service.spreadsheets.return_value.values.return_value.get.return_value.execute.return_value = {
            "values": [["MRAE"]]
        }

        fake_sa_json = json.dumps({"type": "service_account", "project_id": "demo"})
        client = GoogleSheetsClient(
            credentials_file="nao_existe.json",
            credentials_json=fake_sa_json,
            api_key="AIzaSyIgnoradaQuandoHaServiceAccount",
        )
        client.read_sheet_rows("sheet-123", "Concessão")

        mock_build.assert_called_once_with("sheets", "v4", credentials=fake_creds)

    @patch("app.domain.projects.google_sheets_client.build")
    def test_raises_value_error_when_target_sheet_missing(self, mock_build):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        mock_service.spreadsheets.return_value.get.return_value.execute.return_value = {
            "sheets": [{"properties": {"title": "Análise"}}, {"properties": {"title": "Água"}}]
        }

        client = GoogleSheetsClient(
            credentials_file="nao_existe.json",
            api_key="AIzaSyFakeKeyParaTeste123",
        )
        with self.assertRaises(ValueError):
            client.read_sheet_rows("sheet-123", "Concessão")


if __name__ == "__main__":
    unittest.main()
