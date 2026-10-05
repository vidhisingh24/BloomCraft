"""The ``/api/v1`` router. Feature modules mount their routers here from Phase 5 on."""

from fastapi import APIRouter


def build_api_router() -> APIRouter:
    return APIRouter()
