import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.config import settings
from app.core.exceptions import AppException
from app.core.middleware import register_middlewares, logging_middleware
from app.domain.projects.router import router as projects_router
from app.domain.dashboard.router import router as dashboard_router

logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

TAGS_METADATA = [
    {"name": "Projects", "description": "Gestão de Projetos e Carga de Atividades"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger("Gestão de Projetos")
    logger.info("🚀 Gestão de Projetos - API iniciado")
    
    # Criar tabelas no banco de dados automaticamente
    from app.database.base import Base
    from app.database.session import engine
    from app.domain.projects.models import Project
    from app.domain.activities.models import Activity
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Tabelas de banco de dados verificadas/criadas com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar tabelas do banco de dados: {str(e)}")

    yield
    logger.info("🛑 Gestão de Projetos - API encerrado")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Gestão de Projetos - API",
        version="1.0.0",
        debug=settings.app_debug,
        lifespan=lifespan,
        openapi_tags=TAGS_METADATA,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    register_middlewares(app)
    app.middleware("http")(logging_middleware)

    app.include_router(projects_router, prefix="/api/v1")
    app.include_router(dashboard_router)

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.code,
            content={"detail": exc.message},
        )

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "env": settings.app_env}

    return app

app = create_app()