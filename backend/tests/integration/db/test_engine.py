import pytest
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.actor import set_actor
from app.db.session import transaction
from app.modules.catalog.models import Category

pytestmark = pytest.mark.db

DISTINCTIVE = "hidden-parameter-probe-7Q2X"


async def test_errors_do_not_carry_bound_parameters(
    app_sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    """``create_engine`` sets ``hide_parameters``: error strings (and logged tracebacks) would
    otherwise include names, ciphertexts or password hashes."""
    values = {"slug": "dup-probe", "name": DISTINCTIVE}
    with pytest.raises(IntegrityError) as exc:
        async with transaction(app_sessionmaker) as session:
            await set_actor(session, None)
            await session.execute(insert(Category).values(values))
            await session.execute(insert(Category).values(values))
    message = str(exc.value)
    assert DISTINCTIVE not in message
    assert "hidden due to hide_parameters" in message
