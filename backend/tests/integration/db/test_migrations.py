import pytest

from tests.conftest import run_alembic

pytestmark = pytest.mark.db


def test_models_and_migrations_agree(migrated_test_db: None) -> None:
    """The session fixture already ran upgrade → downgrade base → upgrade; here the models are
    compared with the migrated database."""
    result = run_alembic("check")
    assert result.returncode == 0, result.stderr[-3000:]
    assert "No new upgrade operations detected" in result.stdout + result.stderr


def test_single_head(migrated_test_db: None) -> None:
    result = run_alembic("heads")
    assert result.returncode == 0, result.stderr[-2000:]
    heads = [line for line in result.stdout.splitlines() if "(head)" in line]
    assert len(heads) == 1
