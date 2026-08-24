import uuid
from fastapi import APIRouter, HTTPException, status
from app.dependencies import CurrentUser, DBSession
from app.domain.coordenadorias.schemas import CoordenadoriaOut, CoordenadoriaCreate, CoordenadoriaUpdate
from app.domain.coordenadorias import services

router = APIRouter(prefix="/coordenadorias", tags=["Coordenadorias"])

@router.get("", response_model=list[CoordenadoriaOut])
async def list_coords(
    db: DBSession,
    current_user: CurrentUser,
):
    return await services.list_coordenadorias(db)

@router.post("", response_model=CoordenadoriaOut, status_code=status.HTTP_201_CREATED)
async def create_coord(
    data: CoordenadoriaCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    existing = await services.get_coordenadoria_by_name(db, data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordenadoria com este nome já existe.",
        )
    return await services.create_coordenadoria(db, data)

@router.patch("/{id}", response_model=CoordenadoriaOut)
async def update_coord(
    id: uuid.UUID,
    data: CoordenadoriaUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    updated = await services.update_coordenadoria(db, id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordenadoria não encontrada.",
        )
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coord(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    deleted = await services.delete_coordenadoria(db, id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordenadoria não encontrada.",
        )
