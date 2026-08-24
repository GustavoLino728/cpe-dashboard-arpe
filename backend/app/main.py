import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.exceptions import AppException
from app.core.middleware import logging_middleware, register_middlewares
from app.domain.auth.router import router as auth_router
from app.domain.dashboard.router import router as dashboard_router
from app.domain.projects.router import router as projects_router
from app.domain.users.router import router as users_router
from app.domain.notifications.router import router as notifications_router
from app.domain.coordenadorias.router import router as coordenadorias_router

logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

TAGS_METADATA = [
    {"name": "Projects", "description": "Gestão de Projetos e Carga de Atividades"},
    {"name": "Auth", "description": "Autenticação e sessão"},
    {"name": "Users", "description": "Gestão de usuários"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger("Gestão de Projetos")
    logger.info("🚀 Gestão de Projetos - API iniciado")

    from app.database.base import Base
    from app.database.session import engine
    from app.domain.activities.models import Activity
    from app.domain.projects.models import Project
    from app.domain.users.models import User
    from app.domain.notifications.models import Notification
    from app.domain.coordenadorias.models import Coordenadoria
    
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    import asyncio
    from app.domain.projects.services import sync_projects_from_google_sheets

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Tabelas de banco de dados verificadas/criadas com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar tabelas do banco de dados: {str(e)}")

    # Configuração e inicialização do agendador automático (15 minutos)
    scheduler = AsyncIOScheduler()
    
    # Adiciona o job para rodar a cada 15 minutos
    scheduler.add_job(
        sync_projects_from_google_sheets, 
        'interval', 
        minutes=15, 
        id='google_sheets_sync_job',
        replace_existing=True
    )
    scheduler.start()
    logger.info("⏰ Agendador de sincronização automática ativado (intervalo: 15 minutos)")
    
    # Dispara uma primeira sincronização em background logo após o startup para atualizar os dados
    asyncio.create_task(sync_projects_from_google_sheets())

    yield
    
    # Desliga o agendador ao encerrar o servidor
    scheduler.shutdown()
    logger.info("⏰ Agendador de sincronização encerrado")
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
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")
    app.include_router(notifications_router, prefix="/api/v1")
    app.include_router(coordenadorias_router, prefix="/api/v1")

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