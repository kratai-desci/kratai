Target repo: `tiangolo/full-stack-fastapi-template` (small tier). Backend
only - don't touch `frontend/`.

Add category/tag support to items. Items should be able to have multiple
categories (many-to-many), and categories should be their own resource -
give me endpoints to create, list, and delete categories, and let item
creation attach category IDs to the new item.

Follow the same patterns the existing Item resource already uses
(models.py, crud.py, items.py, the router registration in api/main.py) -
categories should feel like a natural extension of how items already work,
not a different style bolted on next to it.

Add test coverage for the new category endpoints, following how
test_items.py and test_users.py are already structured in this repo - don't
skip tests just because I didn't spell out every case. Make sure the
existing item tests still pass untouched.

Definition of done: `uv run bash scripts/lint.sh` passes, and the full
backend test suite passes (existing tests + whatever you add).
