"""
Uso: python seed.py
Insere um usuário admin inicial caso ainda não exista.
"""
import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import engine, get_db
from app.domain.users.models import User


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async for session in get_db():
        result = await session.execute(
            select(User).filter(User.email == "admin@arpe.pe.gov.br")
        )
        if result.scalars().first():
            print("⚠️  Usuário admin já existe. Nenhuma ação tomada.")
            return

        admin = User(
            name="Administrador",
            email="admin@arpe.pe.gov.br",
            password_hash=hash_password("Admin@2026"),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("✅ Usuário admin criado.")
        print("   Email : admin@arpe.pe.gov.br")
        print("   Senha : Admin@2026")
        print("   ⚠️  Troque a senha após o primeiro login!")


if __name__ == "__main__":
    asyncio.run(main())