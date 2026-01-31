# Timeline Generator

## Overview

The timeline generator script (`generate-timeline.js`) scans the repository for files modified today and generates a chronological timeline showing:

- File path (relative to repository root)
- Modification time
- File size
- Git status (committed, modified, added, untracked, etc.)

It also displays any git commits made today with their associated file changes.

## Usage

### Using npm/yarn script (recommended):

```bash
yarn timeline
```

or

```bash
npm run timeline
```

### Direct execution:

```bash
node scripts/generate-timeline.js
```

## Output Format

The script generates a formatted timeline with the following sections:

### 1. File Modification Timeline
Lists all files modified today in chronological order with:
- Sequential numbering
- File path
- Modification timestamp
- File size (formatted as B, KB, MB, GB)
- Git status

Example:
```
1. package.json
   Time:   01/31/2026, 14:30:45
   Size:   2.5 KB
   Status: modified

2. src/index.ts
   Time:   01/31/2026, 14:35:22
   Size:   1.2 KB
   Status: added
```

### 2. Git Commits Today
Lists all commits made today with:
- Commit hash (short form)
- Author
- Timestamp
- Commit message
- Files changed in each commit

## How It Works

1. **Scans the entire repository** recursively, excluding common directories like:
   - `.git`
   - `node_modules`
   - `.yarn`
   - `dist`
   - `build`
   - `coverage`

2. **Filters files** modified since midnight of the current day (00:00:00)

3. **Retrieves git status** for each file to show whether it's:
   - committed
   - modified
   - added
   - deleted
   - untracked
   - renamed

4. **Sorts files** chronologically by modification time

5. **Displays git commits** from today using `git log`

## Use Cases

- **Daily standup reports**: Quickly see what files you worked on today
- **Code review preparation**: Generate a list of modified files before creating a PR
- **Time tracking**: Understand when different parts of the codebase were modified
- **Debugging**: Identify files that might have been accidentally modified
- **Documentation**: Track documentation updates made on a specific day

## Technical Details

- Written in Node.js
- Uses native `fs`, `path`, and `child_process` modules
- No external dependencies required
- Compatible with the existing GraphiQL monorepo structure
- Follows the coding style of other scripts in the repository
