"""Field encryption, blind indexes, tokens and password hashing."""

from app.core.config import Settings
from app.crypto.keyring import install_key_material
from app.crypto.passwords import Argon2Parameters, configure_password_hashing


def install_crypto(settings: Settings) -> None:
    """Install key material and argon2 parameters (app lifespan, CLI, worker, tests)."""
    install_key_material(settings.keys)
    configure_password_hashing(
        Argon2Parameters(
            memory_kib=settings.argon2_memory_kib,
            time_cost=settings.argon2_time_cost,
            parallelism=settings.argon2_parallelism,
        )
    )
