# `ua_pii` — reference rule engine

This Python package is the **source of truth** for checksums, regex detectors, merge, and masking.

The in-browser demo cannot run Python, so `packages/core` is a TypeScript port of the same algorithms, checked against the same fixtures in `/fixtures`.

Evaluation (phase 3) runs against this package.
