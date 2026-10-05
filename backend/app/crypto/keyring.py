"""The one place key bytes live at runtime.

The app lifespan, every CLI command and the worker install ``settings.keys`` at start
(``app.crypto.install_crypto``); tests install their own. With nothing installed, the keys of
``get_settings()`` are used. Key files are read only by ``app.core.config``.
"""

from app.core.config import ConfigError, FieldKeyring, KeyMaterial, KeyName, get_settings

_installed: KeyMaterial | None = None


def install_key_material(keys: KeyMaterial) -> None:
    global _installed
    _installed = keys


def uninstall_key_material() -> None:
    """Back to the ``get_settings()`` fallback (tests)."""
    global _installed
    _installed = None


def installed_key_material() -> KeyMaterial | None:
    return _installed


def current_key_material() -> KeyMaterial:
    return _installed if _installed is not None else get_settings().keys


def require_key(name: KeyName) -> bytes:
    """Key bytes by name; ``ConfigError`` naming the key (never its bytes) when missing."""
    return current_key_material().require(name)


def field_keyring() -> FieldKeyring:
    keyring = current_key_material().field_keyring
    if keyring is None:
        raise ConfigError("key 'field_keyring' is not configured")
    return keyring
