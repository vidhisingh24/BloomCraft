"""Per-request context: request id, client IP and (from Phase 5) the actor."""

import uuid
from collections.abc import Iterable, Sequence
from contextvars import ContextVar, Token
from ipaddress import IPv4Address, IPv4Network, IPv6Address, IPv6Network, ip_address

from app.core.actor import Actor

REQUEST_ID_HEADER = "X-Request-ID"

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)
_client_ip: ContextVar[str | None] = ContextVar("client_ip", default=None)
_actor: ContextVar[Actor | None] = ContextVar("actor", default=None)

Network = IPv4Network | IPv6Network


def get_request_id() -> str | None:
    return _request_id.get()


def get_client_ip() -> str | None:
    return _client_ip.get()


def get_actor() -> Actor | None:
    """The request's actor; ``None`` until Phase 5 authenticates requests."""
    return _actor.get()


def bind_actor(actor: Actor | None) -> Token[Actor | None]:
    """Set the request's actor; pass the returned token to ``reset_actor``."""
    return _actor.set(actor)


def reset_actor(token: Token[Actor | None]) -> None:
    _actor.reset(token)


ContextTokens = tuple[Token[str | None], Token[str | None]]


def set_request_context(request_id: str, client_ip: str | None) -> ContextTokens:
    return _request_id.set(request_id), _client_ip.set(client_ip)


def reset_request_context(tokens: ContextTokens) -> None:
    request_token, ip_token = tokens
    _request_id.reset(request_token)
    _client_ip.reset(ip_token)


def resolve_request_id(inbound: str | None) -> str:
    """Reuse an inbound ``X-Request-ID`` only when it is a valid UUID; otherwise a new UUIDv7."""
    if inbound:
        candidate = inbound.strip()
        if len(candidate) <= 64:
            try:
                return str(uuid.UUID(candidate))
            except ValueError:
                pass
    return str(uuid.uuid7())


def _parse_ip(value: str) -> IPv4Address | IPv6Address | None:
    try:
        return ip_address(value.strip())
    except ValueError:
        return None


def _is_trusted(addr: IPv4Address | IPv6Address, trusted: Sequence[Network]) -> bool:
    return any(addr.version == net.version and addr in net for net in trusted)


def resolve_client_ip(
    peer: str | None,
    forwarded_for: Iterable[str],
    trusted_proxies: Sequence[Network],
) -> str | None:
    """The socket peer, unless the peer is a trusted proxy: then the right-most untrusted
    address in ``X-Forwarded-For``. A malformed hop stops the walk (fall back to the last
    trusted address seen)."""
    peer_addr = _parse_ip(peer) if peer else None
    if peer_addr is None:
        return peer
    if not trusted_proxies or not _is_trusted(peer_addr, trusted_proxies):
        return str(peer_addr)
    hops = [hop for header in forwarded_for for hop in header.split(",") if hop.strip()]
    candidate = peer_addr
    for hop in reversed(hops):
        addr = _parse_ip(hop)
        if addr is None:
            break
        candidate = addr
        if not _is_trusted(addr, trusted_proxies):
            break
    return str(candidate)


def mask_ip(ip: str | None) -> str | None:
    """IPv4 → last octet zeroed; IPv6 → truncated to /48."""
    if ip is None:
        return None
    addr = _parse_ip(ip)
    if addr is None:
        return "invalid"
    if isinstance(addr, IPv4Address):
        return str(IPv4Network(f"{addr}/24", strict=False).network_address)
    return str(IPv6Network(f"{addr}/48", strict=False).network_address)
