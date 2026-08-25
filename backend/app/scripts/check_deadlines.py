import asyncio
from datetime import date
from sqlalchemy import select
from app.database.session import async_session_maker
from app.domain.activities.models import Activity
from app.domain.projects.models import Project
from app.domain.users.models import User
from app.domain.notifications.services import create_notification
from app.core.email import send_email


async def check_deadlines_job():
    async with async_session_maker() as db:
        today = date.today()
        query = select(Activity).where(
            Activity.status != "Concluído",
            Activity.deadline.is_not(None)
        )
        result = await db.execute(query)
        activities = result.scalars().all()

        for activity in activities:
            days_left = (activity.deadline - today).days

            notify = False
            title = ""
            content = ""
            msg_type = "info"

            if days_left == 7:
                notify = True
                title = "Atividade próxima do prazo (7 dias)"
                content = f"A atividade '{activity.description}' vence em 7 dias (prazo: {activity.deadline.strftime('%d/%m/%Y')})."
                msg_type = "info"
            elif days_left == 2:
                notify = True
                title = "Aviso urgente: atividade próxima do prazo (2 dias)"
                content = f"A atividade '{activity.description}' vence em 2 dias (prazo: {activity.deadline.strftime('%d/%m/%Y')})."
                msg_type = "warning"
            elif days_left < 0:
                if days_left == -1:
                    notify = True
                    title = "ALERTA: Atividade ATRASADA"
                    content = f"A atividade '{activity.description}' está atrasada (prazo final era {activity.deadline.strftime('%d/%m/%Y')})."
                    msg_type = "critical"

            if not notify:
                continue

            coordination_emails = []
            if activity.department:
                from app.domain.coordenadorias.models import Coordenadoria
                coordinations_query = select(Coordenadoria).where(Coordenadoria.name.in_(activity.department))
                result_coords = await db.execute(coordinations_query)
                coordinations = result_coords.scalars().all()
                for coord in coordinations:
                    if coord.emails:
                        coordination_emails.extend(coord.emails)

            users_query = select(User).where(User.is_active == True)
            if activity.department:
                users_query = users_query.where(User.department.in_(activity.department))

            result_users = await db.execute(users_query)
            users_to_notify = result_users.scalars().all()

            if not users_to_notify and not coordination_emails:
                continue

            for user in users_to_notify:
                await create_notification(
                    db,
                    user_id=user.id,
                    title=title,
                    content=content,
                    activity_id=activity.id,
                    type=msg_type
                )

                email_html = f"""
                <html>
                    <body style="font-family: sans-serif; color: #16283C; line-height: 1.5;">
                        <h2 style="color: #1B7F79;">{title}</h2>
                        <p>Prezado(a), <strong>{user.name}</strong>. A equipe de Projetos Estratégicos da ARPE informa que: </p>
                        <p>{content}</p>
                        <hr style="border: 0; border-top: 1px solid #D5DBE1; margin: 20px 0;"/>
                        <p style="font-size: 13px; color: #5C7185;">
                            <strong>Atividade:</strong> {activity.description}<br/>
                            <strong>SEI:</strong> {activity.sei_number or '—'}<br/>
                            <strong>Status Atual:</strong> {activity.status}<br/>
                            <strong>Prazo Final:</strong> {activity.deadline.strftime('%d/%m/%Y')}<br/>
                            <strong>Setor(es) Responsável(eis):</strong> {', '.join(activity.department) if activity.department else '—'}
                        </p>
                        <p style="font-size: 13px; color: #5C7185; margin-top: 20px;">
                            Acesse o sistema para verificar o detalhamento completo.
                        </p>
                    </body>
                </html>
                """
                send_email(user.email, f"[CPE - ARPE] {title}", email_html)

            for email in coordination_emails:
                email_html_generic = f"""
                <html>
                    <body style="font-family: sans-serif; color: #16283C; line-height: 1.5;">
                        <h2 style="color: #1B7F79;">{title}</h2>
                        <p>Prezados, a equipe de Projetos Estratégicos da ARPE informa que: </p>
                        <p>{content}</p>
                        <hr style="border: 0; border-top: 1px solid #D5DBE1; margin: 20px 0;"/>
                        <p style="font-size: 13px; color: #5C7185;">
                            <strong>Atividade:</strong> {activity.description}<br/>
                            <strong>SEI:</strong> {activity.sei_number or '—'}<br/>
                            <strong>Status Atual:</strong> {activity.status}<br/>
                            <strong>Prazo Final:</strong> {activity.deadline.strftime('%d/%m/%Y')}<br/>
                            <strong>Setor(es) Responsável(eis):</strong> {', '.join(activity.department) if activity.department else '—'}
                        </p>
                        <p style="font-size: 13px; color: #5C7185; margin-top: 20px;">
                            Acesse o sistema para verificar o detalhamento completo.
                        </p>
                    </body>
                </html>
                """
                send_email(email, f"[CPE - ARPE] {title}", email_html_generic)


if __name__ == "__main__":
    print("⏳ Executando checagem de prazos e disparo de notificações...")
    asyncio.run(check_deadlines_job())
    print("✅ Checagem concluída.")
