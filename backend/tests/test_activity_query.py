import unittest
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from app.dependencies import require_roles
from app.domain.activities.models import Activity
from app.domain.projects import router as projects_router
from app.domain.projects.activity_query import (
    ActivityQueryParams,
    build_activities_select_and_kpis_queries,
    build_full_row_search_clause,
)
from app.domain.users.models import User


class _FakeScalarResult:
    def __init__(self, values):
        self._values = values

    def scalars(self):
        return self

    def all(self):
        return self._values


class _FakeKpiResult:
    def __init__(self, row):
        self._row = row

    def one(self):
        return self._row


class _FakeRowsResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class TestActivityQueryAndRouter(unittest.IsolatedAsyncioTestCase):
    def test_full_row_search_compiles_secondary_columns_and_escapes_wildcards(self):
        clause = build_full_row_search_clause("50%_água recebida")
        compiled = clause.compile(dialect=postgresql.dialect())
        sql_text = str(compiled)

        for column_name in (
            "activities.observations",
            "activities.sei_number",
            "activities.sei_2",
            "activities.clause",
            "activities.prior_step",
            "activities.final_deadline_text",
            "activities.object_summary",
            "activities.description",
        ):
            self.assertIn(column_name, sql_text)

        self.assertIn("ESCAPE '\\'", sql_text)
        self.assertTrue(
            any(
                val == "%50\\%\\_agua recebida%"
                for val in compiled.params.values()
            )
        )

    def test_combined_filters_and_period_compile_with_kpis_and_open_end_rule(self):
        params = ActivityQueryParams(
            page=2,
            limit=15,
            mrae="MRAE - I",
            instrumento="Contrato de Concessão",
            mes_inicial="2026-04",
            mes_final="2026-11",
            executor="DSAN",
            status_filter="pending",
            search="filtros de agua",
            reference_date=date(2026, 11, 26),
        )
        items_stmt, kpis_stmt = build_activities_select_and_kpis_queries(params)

        items_compiled = items_stmt.compile(dialect=postgresql.dialect())
        kpis_compiled = kpis_stmt.compile(dialect=postgresql.dialect())
        items_sql = str(items_compiled)
        kpis_sql = str(kpis_compiled)

        self.assertIn("trim(activities.mrae)", items_sql)
        self.assertIn("trim(activities.instrument)", items_sql)
        self.assertIn("ANY (activities.department)", items_sql)
        self.assertIn("IS NULL", items_sql)
        self.assertIn("activities.id ASC", items_sql)
        self.assertIn(date(2026, 4, 1), items_compiled.params.values())
        self.assertIn(date(2026, 11, 30), items_compiled.params.values())

        for alias in ("total", "concluidas", "atrasadas", "em_andamento", "a_iniciar"):
            self.assertIn(f"AS {alias}", kpis_sql)

    async def test_list_paginated_activities_returns_kpis_and_dynamic_options(self):
        now = datetime.now(timezone.utc)
        proj_id = uuid4()
        act_id = uuid4()
        activity = Activity(
            id=act_id,
            project_id=proj_id,
            source_row_key="row-key-1",
            mrae="MRAE - I",
            instrument="Contrato de Concessão",
            clause="Cláusula 8.5.6",
            phase="Transição",
            thematic_group="Qualidade da Água",
            description="Monitorar recebimento",
            department=["DSAN"],
            start_date=date(2026, 2, 1),
            deadline=None,
            final_deadline_text="Não se aplica",
            status="A Iniciar",
            observations="Filtros de água recebidos",
            created_at=now,
            updated_at=now,
        )

        db = AsyncMock()
        db.execute = AsyncMock(
            side_effect=[
                _FakeScalarResult(["Concessão"]),
                _FakeScalarResult(["MRAE - I", "MRAE - II"]),
                _FakeScalarResult(["Contrato de Concessão", "Contrato de Interdependência"]),
                _FakeScalarResult([["ARPE (DSAN)"], ["CCPE", "DEF"], ["Sem Setor"]]),
                _FakeKpiResult(
                    SimpleNamespace(
                        total=12,
                        concluidas=2,
                        atrasadas=1,
                        em_andamento=3,
                        a_iniciar=6,
                    )
                ),
                _FakeRowsResult([(activity, "Concessão")]),
            ]
        )

        response = await projects_router.list_paginated_activities(
            db=db,
            page=1,
            limit=15,
            mrae="MRAE - I",
            instrumento="Contrato de Concessão",
            mes_inicial="2026-04",
            mes_final="2026-11",
            executor="DSAN",
            status_filter="pending",
            search="filtros de agua recebidos",
        )

        self.assertEqual(response.total, 12)
        self.assertEqual(response.kpis.total, 12)
        self.assertEqual(response.kpis.concluidas, 2)
        self.assertEqual(response.kpis.atrasadas, 1)
        self.assertEqual(response.kpis.em_andamento, 3)
        self.assertEqual(response.kpis.a_iniciar, 6)
        self.assertEqual(response.mraes, ["MRAE - I", "MRAE - II"])
        self.assertEqual(
            response.instrumentos,
            ["Contrato de Concessão", "Contrato de Interdependência"],
        )
        self.assertEqual(response.executores, ["CCPE", "DEF", "DSAN"])
        self.assertEqual(response.coordenadorias, ["CCPE", "DEF", "DSAN"])
        self.assertEqual(len(response.activities), 1)
        self.assertEqual(response.activities[0].observations, "Filtros de água recebidos")

    async def test_list_paginated_activities_rejects_invalid_period_with_400(self):
        db = AsyncMock()

        with self.assertRaises(HTTPException) as inverted_ctx:
            await projects_router.list_paginated_activities(
                db=db,
                mes_inicial="2026-11",
                mes_final="2026-04",
            )
        self.assertEqual(inverted_ctx.exception.status_code, 400)

        with self.assertRaises(HTTPException) as bad_fmt_ctx:
            await projects_router.list_paginated_activities(
                db=db,
                mes_inicial="13/2026",
            )
        self.assertEqual(bad_fmt_ctx.exception.status_code, 400)

    async def test_protected_routes_keep_rbac_403_for_servidor(self):
        dep = require_roles("admin", "coordenador")
        servidor = User(
            name="Servidor",
            email="servidor@arpe.pe.gov.br",
            password_hash="hash",
            role="servidor",
            is_active=True,
        )
        with self.assertRaises(HTTPException) as ctx:
            await dep(current_user=servidor)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
