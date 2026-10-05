"""``python -m app.workers``: the outbox worker process (idle loop until Phase 4).

Stops gracefully on Ctrl+C / SIGINT / SIGTERM / SIGBREAK. ``loop.add_signal_handler`` is not
available on Windows, so plain ``signal.signal`` handlers set a stop event on the loop.
"""

import asyncio
import signal
from types import FrameType

import structlog

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.crypto import install_crypto

HEARTBEAT_SECONDS = 60.0

log = structlog.get_logger("bloomcraft.worker")


async def run_worker(
    stop: asyncio.Event, *, worker_id: str, heartbeat_seconds: float = HEARTBEAT_SECONDS
) -> None:
    """Idle until ``stop`` is set, logging a heartbeat every ``heartbeat_seconds``."""
    log.info("worker_started", worker_id=worker_id)
    while not stop.is_set():
        try:
            await asyncio.wait_for(stop.wait(), timeout=heartbeat_seconds)
        except TimeoutError:
            log.info("worker_heartbeat", worker_id=worker_id)
    log.info("worker_stopped", worker_id=worker_id)


def _shutdown_signals() -> list[signal.Signals]:
    names = ("SIGINT", "SIGTERM", "SIGBREAK")
    return [getattr(signal, name) for name in names if hasattr(signal, name)]


async def _main(worker_id: str) -> None:
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()

    def request_stop(signum: int, _frame: FrameType | None) -> None:
        log.info("worker_signal", signal=signal.Signals(signum).name)
        loop.call_soon_threadsafe(stop.set)

    previous = {sig: signal.signal(sig, request_stop) for sig in _shutdown_signals()}
    try:
        await run_worker(stop, worker_id=worker_id)
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)


def main() -> int:
    settings = get_settings()
    configure_logging(settings)
    install_crypto(settings)
    asyncio.run(_main(settings.worker_id))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
