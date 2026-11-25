import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from app.core.exceptions import TooManyRequestsError
from app.dependencies import get_current_user, require_roles
from app.domain.projects import router as projects_router
from app.domain.projects import services
from app.domain.users.models import User


class TestSyncServiceAndRouter(unittest.IsolatedAsyncioTestCase):
    async def test_manual_sync_blocked_during_one_minute_cooldown(self):
        fake_session = AsyncMock()
        fake_ctx = MagicMock()
        fake_ctx.__aenter__ = AsyncMock(return_value=fake_session)
        fake_ctx.__aexit__ = AsyncMock(return_value=False)

        with (
            patch.object(
                services.settings,
                "google_sheet_url",
                "https://docs.google.com/spreadsheets/d/abc123/edit",
            ),
            patch.object(services, "async_session_maker", return_value=fake_ctx),
            patch.object(
                services,
                "get_manual_sync_status",
                AsyncMock(
                    return_value={
                        "can_sync_now": False,
                        "cooldown_seconds": 60,
                        "retry_after_seconds": 42,
                        "next_allowed_at": datetime.now(timezone.utc) + timedelta(seconds=42),
                        "last_sync_at": datetime.now(timezone.utc) - timedelta(seconds=18),
                        "last_sync_by": "manual",
                        "last_sync_items": 344,
                    }
                ),
            ),
        ):
            with self.assertRaises(TooManyRequestsError) as ctx:
                await services.sync_projects_from_google_sheets(triggered_by="manual")

            self.assertEqual(ctx.exception.code, 429)
            self.assertEqual(ctx.exception.retry_after_seconds, 42)
            self.assertIn("42s", ctx.exception.message)

    def test_fetch_google_sheets_data_raises_when_sheet_returns_empty_activities(self):
        fake_client = MagicMock()
        fake_client.read_sheet_rows.return_value = ("Concessão", [["MRAE", "Ação"]])

        with self.assertRaises(ValueError):
            services.fetch_google_sheets_data("sheet-123", client=fake_client)

    async def test_get_current_user_raises_401_without_credentials(self):
        with self.assertRaises(HTTPException) as ctx:
            await get_current_user(db=AsyncMock(), credentials=None)
        self.assertEqual(ctx.exception.status_code, 401)

    async def test_require_roles_rejects_servidor_and_allows_coordenador(self):
        dep = require_roles("admin", "coordenador")
        servidor = User(
            name="Servidor",
            email="servidor@arpe.pe.gov.br",
            password_hash="hash",
            role="servidor",
            is_active=True,
        )
        coordenador = User(
            name="Coordenador",
            email="coord@arpe.pe.gov.br",
            password_hash="hash",
            role="coordenador",
            is_active=True,
        )

        with self.assertRaises(HTTPException) as ctx:
            await dep(current_user=servidor)
        self.assertEqual(ctx.exception.status_code, 403)

        allowed = await dep(current_user=coordenador)
        self.assertEqual(allowed.email, "coord@arpe.pe.gov.br")

    async def test_sync_router_maps_cooldown_to_429_with_retry_after_header(self):
        fake_admin = User(
            name="Admin",
            email="admin@arpe.pe.gov.br",
            password_hash="hash",
            role="admin",
            is_active=True,
        )
        with patch.object(
            projects_router,
            "sync_projects_from_google_sheets",
            AsyncMock(
                side_effect=TooManyRequestsError(
                    message="Sincronização manual realizada recentemente. Aguarde 35s para sincronizar novamente.",
                    retry_after_seconds=35,
                )
            ),
        ):
            with self.assertRaises(HTTPException) as ctx:
                await projects_router.sync_google_sheets(_=fake_admin)

        self.assertEqual(ctx.exception.status_code, 429)
        self.assertEqual(ctx.exception.headers, {"Retry-After": "35"})
        self.assertIn("35s", str(ctx.exception.detail))


if __name__ == "__main__":
    unittest.main()
