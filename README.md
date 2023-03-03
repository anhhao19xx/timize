# Timize

_A Productivity app for manage time and your schedule_

## Event

- `id`
- `title`
- `from`
- `to`
- `color`
- `note`
- `noteEncrypted`
- `notePin`
- `done`
- `createdAt`
- `updatedAt`

## Backend Design

**`tzevents`** table

- `id` (by default)
- `user`
- `from`
- `to`
- `data` (encrypted)
  - `title`
  - `color`
  - `note`
  - `done`
- `createdAt` (by default)
- `updatedAt` (by default)

**`tzcontent`** table

- `id` (by default)
- `user`
- `data` (encrypted)
  - `title`
  - `parent`
  - `notes`
