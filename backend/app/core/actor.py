"""The authenticated principal of a request (set from Phase 5 on)."""

import uuid
from dataclasses import dataclass
from typing import Literal, get_args

Role = Literal["customer", "seller", "admin"]
ROLES: tuple[Role, ...] = get_args(Role)


@dataclass(frozen=True, slots=True)
class Actor:
    user_id: uuid.UUID
    role: Role
