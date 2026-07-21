from fastapi import APIRouter, Response, status

from app.config import settings
from app.dependencies import CurrentUser, DBSession
from app.domain.auth.schemas import LoginIn, RegisterIn, RegisterOut, TokenOut
from app.domain.auth.services import authenticate, register_user
from app.domain.users.schemas import UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Autenticar usuário",
)
async def login(payload: LoginIn, response: Response, db: DBSession):
    """
    Autentica com e-mail e senha.
    Emite cookie HttpOnly com JWT em caso de sucesso.
    """
    _, token = await authenticate(db, payload.email, payload.password)

    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    return TokenOut()


@router.post(
    "/register",
    response_model=RegisterOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo usuário",
)
async def register(
    payload: RegisterIn,
    db: DBSession,
):
    """
    Cria um novo usuário no sistema.
    Restrito a administradores autenticados.
    """
    await register_user(
        db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
    )
    return RegisterOut()


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerrar sessão",
)
async def logout(response: Response):
    """Remove o cookie de sessão."""
    response.delete_cookie(key=settings.cookie_name, path="/")


@router.get(
    "/me",
    response_model=UserOut,
    summary="Usuário da sessão atual",
)
async def me(current_user: CurrentUser):
    """Retorna os dados do usuário autenticado."""
    return current_user