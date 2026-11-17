import logging
import os

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.database.session import get_db
from app.domain.users.models import User

logger = logging.getLogger("Gestão de Projetos")


async def seed_admin() -> None:
    """
    Cria o usuário admin se ainda não existir.

    - Idempotente: se já existir, não faz nada.
    - Seguro para múltiplas réplicas: se duas instâncias tentarem criar
      ao mesmo tempo, a UNIQUE constraint no email garante que uma delas
      vai falhar — e o IntegrityError é tratado.
    """
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        logger.warning(
            "⚠️  ADMIN_EMAIL/ADMIN_PASSWORD não definidos — seed do admin ignorado."
        )
        return

    async for session in get_db():
        try:
            result = await session.execute(
                select(User).filter(User.email == admin_email)
            )
            if result.scalars().first():
                logger.info(f"⚠️  Usuário admin '{admin_email}' já existe.")
                return

            admin = User(
                name="Administrador",
                email=admin_email,
                password_hash=hash_password(admin_password),
                role="admin",
                department="CTI",
                is_active=True,
            )
            session.add(admin)

            try:
                await session.commit()
            except IntegrityError:
                # Outra réplica criou ao mesmo tempo — sem problema.
                await session.rollback()
                logger.info(
                    f"⚠️  Usuário admin '{admin_email}' criado por outra instância."
                )
                return

            logger.info(f"✅ Usuário admin criado: {admin_email}")
            logger.info("   ⚠️  Troque a senha após o primeiro login!")
        finally:
            break  # garante que o gerador de get_db seja finalizado


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_admin())