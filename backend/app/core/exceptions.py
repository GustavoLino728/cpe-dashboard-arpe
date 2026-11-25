from fastapi import HTTPException, status


class AppException(Exception):
    """Base para todas as exceções de domínio."""

    def __init__(self, message: str, code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(AppException):
    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Sem permissão para esta ação"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflito com recurso existente"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Não autenticado"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class TooManyRequestsError(AppException):
    def __init__(
        self,
        message: str = "Muitas requisições. Tente novamente em instantes.",
        retry_after_seconds: int = 60,
    ):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS)


# HTTP shortcuts (para uso nos routers quando necessário)
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciais inválidas",
    headers={"WWW-Authenticate": "Bearer"},
)