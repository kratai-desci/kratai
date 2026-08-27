# Ticket 001: Add an `is_verified` flag to users

Target repo: `tiangolo/full-stack-fastapi-template` (small tier)

## Requirements

1. Add an `is_verified: bool = False` column to the `User` table model in
   `backend/app/models.py`, and reflect it in the `UserPublic` read schema so
   it's returned by the API.
2. Add a new endpoint `POST /api/v1/users/{user_id}/verify` in
   `backend/app/api/routes/users.py`, superuser-only, that sets
   `is_verified = True` on the target user and returns the updated user.
   Return 404 if the user doesn't exist.
3. Add an Alembic migration for the new column
   (`backend/app/alembic/versions/`).
4. `backend/tests/api/routes/test_users.py` already has test coverage for
   every other endpoint in `users.py` (see `test_delete_user_without_privileges`
   and neighboring tests for the pattern). Add equivalent coverage for the new
   endpoint in that same file, following its existing patterns exactly:
   - a superuser success case (verifying a real user, asserting
     `is_verified` is `True` in both the response and the database),
   - a not-found case (`404` for a nonexistent user id),
   - a permission-denied case (non-superuser gets `403`).
5. Do not modify unrelated files.

## Definition of done

- `uv run bash scripts/lint.sh` (or repo's equivalent lint/typecheck command)
  passes on the changed files.
- The new endpoint is reachable and superuser-gated the same way the
  existing user-management endpoints in the same file are.
- All three new test cases exist in `test_users.py` and would pass.
