import json
import logging
import os
import re
import unicodedata
from typing import Any, Protocol

from google.oauth2 import service_account
from googleapiclient.discovery import build

logger = logging.getLogger("Gestão de Projetos")

SHEETS_READONLY_SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


class SheetReaderPort(Protocol):
    """Contrato (Port) da camada de aplicação para leitura de uma aba de planilha."""

    def read_sheet_rows(
        self,
        spreadsheet_id: str,
        target_sheet_name: str = "Concessão",
    ) -> tuple[str, list[list[Any]]]:
        """Retorna (titulo_real_da_aba, matriz_de_linhas)."""
        ...


def normalize_sheet_title(title: str) -> str:
    """Remove acentos, espaços nas pontas e normaliza para maiúsculo."""
    nfkd = unicodedata.normalize("NFKD", title)
    without_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
    return without_accents.strip().upper()


def extract_spreadsheet_id(sheet_url_or_id: str) -> str:
    """Extrai o ID da planilha a partir da URL do Google Sheets ou aceita o ID direto."""
    cleaned = sheet_url_or_id.strip()
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", cleaned)
    spreadsheet_id = match.group(1) if match else cleaned
    if not spreadsheet_id:
        raise ValueError("O link ou ID da planilha definido em GOOGLE_SHEET_URL é inválido.")
    return spreadsheet_id


class GoogleSheetsClient:
    """
    Adapter de Infraestrutura para a Google Sheets API v4.

    Implementa o contrato SheetReaderPort protegendo o domínio e os Use Cases
    contra detalhes de autenticação (Service Account vs API Key) e HTTP da SDK do Google.
    """

    def __init__(
        self,
        credentials_file: str = "credentials.json",
        credentials_json: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self.credentials_file = credentials_file
        self.credentials_json = credentials_json
        self.api_key = api_key.strip() if api_key else None

    def _load_service_account_credentials(self):
        if self.credentials_file and os.path.exists(self.credentials_file):
            try:
                creds = service_account.Credentials.from_service_account_file(
                    self.credentials_file,
                    scopes=SHEETS_READONLY_SCOPES,
                )
                logger.info("Credencial Google carregada via arquivo credentials.json.")
                return creds
            except Exception as exc:
                logger.warning("Erro ao ler credentials.json: %s", exc)

        if self.credentials_json and self.credentials_json.strip():
            try:
                creds_info = json.loads(self.credentials_json)
                creds = service_account.Credentials.from_service_account_info(
                    creds_info,
                    scopes=SHEETS_READONLY_SCOPES,
                )
                logger.info("Credencial Google carregada via GOOGLE_CREDENTIALS.")
                return creds
            except Exception as exc:
                raise RuntimeError(f"Erro ao analisar GOOGLE_CREDENTIALS: {exc}") from exc

        return None

    def _build_service(self):
        """
        Constrói o client REST 'sheets' v4 usando Service Account ou API Key.
        """
        creds = self._load_service_account_credentials()
        if creds is not None:
            return build("sheets", "v4", credentials=creds)

        if self.api_key:
            logger.info("Credencial Google carregada via GOOGLE_API_KEY.")
            return build("sheets", "v4", developerKey=self.api_key)

        raise FileNotFoundError(
            "Credenciais do Google não encontradas. Configure 'credentials.json', "
            "'GOOGLE_CREDENTIALS' ou 'GOOGLE_API_KEY'."
        )

    def read_sheet_rows(
        self,
        spreadsheet_id: str,
        target_sheet_name: str = "Concessão",
    ) -> tuple[str, list[list[Any]]]:
        """
        Busca os metadados da planilha, localiza a aba desejada e retorna suas linhas.
        """
        service = self._build_service()
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()

        target_normalized = normalize_sheet_title(target_sheet_name)
        matched_title: str | None = None
        for sheet in spreadsheet.get("sheets", []):
            title = sheet.get("properties", {}).get("title", "")
            if normalize_sheet_title(title) == target_normalized:
                matched_title = title
                break

        if matched_title is None:
            available = [
                sheet.get("properties", {}).get("title", "")
                for sheet in spreadsheet.get("sheets", [])
            ]
            raise ValueError(
                f"Aba '{target_sheet_name}' não encontrada na planilha. Abas disponíveis: {available}"
            )

        safe_title = matched_title.replace("'", "''")
        sheet_range = f"'{safe_title}'"
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=sheet_range)
            .execute()
        )
        return matched_title, result.get("values", [])
