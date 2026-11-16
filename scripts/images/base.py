"""Source-adapter seam: every image source implements ImageSource and
returns a normalized Candidate. Sources contain no business logic
(verification lives in matcher, orchestration in pipeline)."""
from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Callable, Optional, Protocol, TypeVar


@dataclass(frozen=True)
class ProductRef:
    product_id: str
    brand: str
    name: str
    category: str = ""


@dataclass(frozen=True)
class Candidate:
    image_url: str     # direct image URL to download
    source_url: str    # page/API URL proving provenance
    brand: str         # brand as reported by the source
    name: str          # product name as reported by the source
    source: str        # adapter name
    id_anchored: bool = False  # source confirmed the exact product_id (not a search hit)


class SourceError(Exception):
    """Transient failure (timeout, 5xx) — retryable."""


class SourceBlocked(Exception):
    """Source refuses us (403/429/captcha). Stop using this source; never bypass."""


class ImageSource(Protocol):
    name: str

    def find(self, product: ProductRef) -> Optional[Candidate]:
        """Return a candidate or None if not found. May raise SourceError/SourceBlocked."""
        ...


class RateLimiter:
    """Sleeps a random delay in [min_s, max_s] between calls."""

    def __init__(self, min_s: float, max_s: float, sleep: Callable[[float], None] = time.sleep):
        self.min_s, self.max_s, self._sleep = min_s, max_s, sleep
        self._first = True

    def wait(self) -> None:
        if self._first:
            self._first = False
            return
        self._sleep(random.uniform(self.min_s, self.max_s))


T = TypeVar("T")


def with_retry(fn: Callable[[], T], attempts: int = 3, backoff_s: float = 2.0,
               sleep: Callable[[float], None] = time.sleep) -> T:
    """Retry fn on SourceError with exponential backoff. SourceBlocked is not retried."""
    for i in range(attempts):
        try:
            return fn()
        except SourceError:
            if i == attempts - 1:
                raise
            sleep(backoff_s * (2 ** i))
    raise AssertionError("unreachable")
