"""Resolve overlapping detections.

Structured types are mutually exclusive on overlap (higher priority, then longer span).
ADDRESS and PERSON may contain a structured identifier: nested pairs are kept.
"""

from __future__ import annotations

from ua_pii.types import CONTAINER_TYPES, PRIORITY, Entity


def overlaps(a: Entity, b: Entity) -> bool:
    return a.start < b.end and b.start < a.end


def contains(outer: Entity, inner: Entity) -> bool:
    return outer.start <= inner.start and outer.end >= inner.end and (
        outer.end - outer.start > inner.end - inner.start
    )


def merge(entities: list[Entity]) -> list[Entity]:
    if not entities:
        return []

    structured = [e for e in entities if e.type not in CONTAINER_TYPES]
    containers = [e for e in entities if e.type in CONTAINER_TYPES]

    kept_struct = _greedy(structured)
    kept_containers: list[Entity] = []
    for container in _greedy(containers):
        if _partial_conflict(container, kept_struct):
            continue
        kept_containers.append(container)

    merged = kept_struct + kept_containers
    merged.sort(key=lambda e: (e.start, e.end, e.type.value))
    return merged


def _priority_key(entity: Entity) -> tuple[int, int, int]:
    return (PRIORITY[entity.type], entity.end - entity.start, -entity.start)


def _greedy(entities: list[Entity]) -> list[Entity]:
    ordered = sorted(entities, key=_priority_key, reverse=True)
    kept: list[Entity] = []
    for entity in ordered:
        if any(overlaps(entity, other) for other in kept):
            continue
        kept.append(entity)
    return kept


def _partial_conflict(container: Entity, structured: list[Entity]) -> bool:
    for item in structured:
        if not overlaps(container, item):
            continue
        nested = contains(container, item) or contains(item, container)
        if not nested:
            return True
    return False


