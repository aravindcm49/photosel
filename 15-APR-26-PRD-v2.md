# Wedding Photo Selector

**Date:** 15-APR-26  
**Version:** 2  
**Status:** Draft

---

## Problem Statement

A wedding photographer or couple needs to efficiently review and select photos from a large folder (hundreds to thousands of images). They need to:
- Quickly decide which photos to keep or skip
- Tag who's in each photo for reference
- Track progress across multiple sessions (resume later)
- Export a clean list of selected photos for the photographer

---

## Solution

A React web app with shadcn UI that provides a focused, single-photo review interface. Users open a folder, review photos one-by-one with keyboard shortcuts and buttons, tag people, and export selected photos as text files. All progress is saved to IndexedDB for seamless resume.

---

## User Stories

### Folder Management
1. As a user, I want to open a folder of wedding photos via file picker, so that I can start reviewing images
2. As a user, I want to see a list of previously opened folders on the home screen, so that I can pick up where I left off
3. As a user, I want to see progress (e.g., "42/156 reviewed") for each saved folder, so that I know how much work remains
4. As a user, I want to delete a saved folder's progress, so that I can start fresh if needed
5. As a user, I want the app to analyze all photos and set a consistent display aspect ratio, so that the UI feels uniform even with varied image sizes
6. As a user, I want to be warned when opening a folder with no supported images, so that I can recover gracefully
7. As a user, I want the app to handle folder permission errors gracefully, so that I can re-grant access if needed
8. As a user, I want to close the app mid-session and resume later with all decisions intact, so that I don't lose work

### Photo Review
9. As a user, I want to see one photo at a time in a full-screen view, so that I can focus on each image
10. As a user, I want to press arrow keys (← →) to navigate between photos, so that I can move quickly
11. As a user, I want auto-advance after pressing Skip or Add to List, so that momentum is maintained
12. As a user, I want a Previous button (and ← key) to go back and review/edit past decisions, so that I can change my mind
13. As a user, I want a progress indicator showing "X/Y reviewed", so that I know how far I've gotten
14. As a user, I want to see the summary screen when all photos are reviewed, so that I can export my selections
15. As a user, I want to see a visual indication when navigating to an already-reviewed photo, so that I can see existing decisions

### Photo Actions
16. As a user, I want to press `S` or click "Skip" to mark a photo as skipped, so that I can move on quickly
17. As a user, I want to press `A` or click "Add to List" to mark a photo as selected, so that I can build my list
18. As a user, I want to see a colored status badge (green ✓ Selected / red ✗ Skipped) at the top-right of the current photo, so that I instantly know the photo's state
19. As a user, I want to press `R` or click a Rotate button to rotate the photo 90° clockwise, so that I can correct orientation issues
20. As a user, I want my rotation to be saved and restored when navigating, so that orientation persists
21. As a user, I want keyboard shortcuts to be DISABLED when I'm typing in the chip input, so that I don't accidentally skip/select photos while tagging

### People Tagging
22. As a user, I want to press `T` or focus the chip input to tag people in the current photo, so that I can track who appears
23. As a user, I want to type names in a chip input that shows autocomplete from previously used names, so that I can tag quickly
24. As a user, I want to type multiple names separated by commas and have them become separate chips, so that I can add multiple people at once
25. As a user, I want to press Enter or comma to add a chip and start a new name entry, so that the flow is smooth
26. As a user, I want to click a chip to remove it, so that I can correct mistakes
27. As a user, I want people badges to appear at the bottom center of the photo AFTER I finish input (blur/Enter), so that the view is clean while typing
28. As a user, I want multiple name badges to display in a horizontal row with overflow scroll, so that all names are visible
29. As a user, I want the people tags saved to IndexedDB for the current photo, so that they persist on resume
30. As a user, I want to be warned if I navigate away while still typing a name, so that I don't lose partial input

### Export
31. As a user, I want to click an Export button on the summary screen, so that I can get my final lists
32. As a user, I want two separate files exported: `Selected.txt` and `Skipped.txt`, so that the photographer gets clean lists
33. As a user, I want files to contain just the filenames (one per line), so that they're easy to use
34. As a user, I want the export to trigger a browser download to my Downloads folder, so that no special permissions are needed
35. As a user, I want to see a confirmation that the export was successful, so that I know it worked

### Keyboard Shortcuts
36. As a user, I want to use `←` and `→` for navigation, so that I can move quickly without reaching for the mouse
37. As a user, I want to use `S` for Skip, `A` for Add, `T` for Tag input, and `R` for Rotate, so that I can operate entirely from the keyboard

---

## Implementation Decisions

### Screens

| Screen | Purpose | Entry Point |
|--------|---------|-------------|
| **HomeScreen** | List saved folders, open new folder | App root |
| **PhotoReviewScreen** | Main photo review loop | Resume from Home or new folder |
| **SummaryScreen** | Review counts, export | Auto-triggered when all reviewed |

### Home Screen
- Lists saved projects from IndexedDB as cards
- Each card: folder name, progress ("42/156 reviewed"), Resume button, Delete button
- Empty state: "No projects yet" illustration + "Open Folder" button
- "Open Folder" triggers `showDirectoryPicker()` from File System Access API

### Photo Review Screen
- Header: Progress indicator ("42/156") + folder name (left)
- Image area: Centered, letterboxed to analyzed aspect ratio
- Overlays on image:
  - Top-left: Rotate button (icon only, frosted glass)
  - Top-right: Status badge (Selected/Skipped/None)
  - Bottom center: Frosted glass bar with action buttons + chip input
- People badges: Horizontal scrollable row at bottom center of image, above input bar

### Summary Screen
- Shows: "X selected" | "Y skipped"
- If X or Y is 0, show that count in gray/muted style
- "Export Selected.txt & Skipped.txt" button
- "Back to Home" link
- Success toast after export

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Progress: 42/156]           [Folder: Wedding]      │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Rotate]                              [✓/✗ Badge]   │  ← Overlays
│                                                     │
│                                                     │
│              ┌─────────────────────┐                │
│              │                     │                │
│              │    PHOTO AREA       │                │
│              │                     │                │
│              │  [People] [People]  │                │  ← Badges on image
│              └─────────────────────┘                │
│                                                     │
│         [Skip]   [Chip Input]   [Add to List]      │  ← Action bar
└─────────────────────────────────────────────────────┘
```

### Data Model (IndexedDB)

**Database: `wedding-photo-selector`**

```typescript
// Store: `projects` (keyPath: folderName)
interface Project {
  folderName: string;
  totalPhotos: number;
  reviewedCount: number;
  createdAt: number;
  updatedAt: number;
  photos: Record<string, PhotoData>;
}

interface PhotoData {
  filename: string;
  status: 'selected' | 'skipped' | null;
  people: string[];
  timestamp: number;
  rotation: 0 | 90 | 180 | 270;
}

// Store: `globalPeople` (keyPath: id, autoIncrement)
interface GlobalPerson {
  id?: number;
  name: string;
  createdAt: number;
}
```

**Note:** FileSystemDirectoryHandle cannot be serialized to JSON. On resume:
1. Load project from IndexedDB
2. Re-prompt user to select the same folder via `showDirectoryPicker()`
3. Store the new handle in memory (not persisted)
4. If user cancels permission, show error and return to Home

### Module Architecture

```
src/
├── App.tsx                    # Router setup
├── lib/
│   ├── db.ts                  # IndexedDB operations (CRUD for projects, global people)
│   ├── export.ts              # Generate and download .txt files
│   ├── file-system.ts         # File System Access API wrappers
│   └── image-utils.ts         # Aspect ratio analysis, rotation helpers
├── screens/
│   ├── HomeScreen.tsx         # Folder list, open new folder
│   ├── PhotoReviewScreen.tsx  # Main review loop
│   └── SummaryScreen.tsx      # Review counts, export
├── components/
│   ├── PhotoViewer.tsx        # Image display with rotation, letterboxing
│   ├── ActionBar.tsx          # Skip/Add buttons + chip input container
│   ├── ChipInput.tsx          # Autocomplete input with chips
│   ├── StatusBadge.tsx       # Selected/Skipped indicator
│   ├── ProgressIndicator.tsx  # "X/Y reviewed"
│   ├── RotateButton.tsx       # Rotate 90° clockwise
│   ├── PeopleBadges.tsx       # Display name chips on image
│   └── FolderCard.tsx         # Home screen folder item
├── hooks/
│   ├── useKeyboardShortcuts.ts  # Global keyboard handler
│   ├── useProject.ts            # Project state management
│   └── usePhotoLoader.ts        # Load photos from folder handle
├── context/
│   └── ProjectContext.tsx     # Share project state across components
└── types/
    └── index.ts               # TypeScript interfaces
```

### Key Implementation Details

**1. Keyboard Shortcut Handling**
```typescript
// Shortcuts are DISABLED when chip input is focused
// Use document.activeElement to check focus state
const handleKeyDown = (e: KeyboardEvent) => {
  if (document.activeElement?.tagName === 'INPUT') return; // Skip if typing
  // Handle arrows, S, A, T, R
};
```

**2. Aspect Ratio Analysis Algorithm**
```typescript
// Collect aspect ratios from first 20 photos (or all if < 20)
// Group into buckets: portrait (< 0.8), landscape (> 1.2), square (0.8-1.2)
// Use mode bucket, default to 3:4 (common for photos)
```

**3. Photo Preloading**
```typescript
// Preload next 3 photos using Image() objects
// Store in a Map with LRU eviction (max 10 in memory)
// Use blob URLs created from FileSystemFileHandle
```

**4. People Chip Input Flow**
```
1. User types → show autocomplete dropdown
2. User selects OR presses comma/Enter → create chip, clear input
3. Repeat
4. On blur OR after last chip created → commit all to photo
5. Badges appear below image
```

**5. Uncommitted Input Warning**
```typescript
// If user navigates while typing (input has value):
// - Confirm: "You have uncommitted tags. Discard?"
// - Yes: Clear input, navigate
// - No: Stay, keep input focused
```

### Shadcn Components

| Component | Usage |
|-----------|-------|
| `Button` | Skip, Add to List, Export, Resume, Delete |
| `Badge` | Status badge, people name badges |
| `Input` | Chip input text field |
| `Card` | Folder card on home screen |
| `Separator` | Between sections |
| `Tooltip` | Keyboard shortcut hints |
| `Toast` | Export success, errors |

### Error Handling

| Scenario | Handling |
|----------|----------|
| User denies folder permission | Show "Permission required" message, return to Home |
| Folder contains 0 images | Show "No photos found" with supported formats list |
| IndexedDB read/write failure | Show error toast, allow retry |
| Image fails to load | Show placeholder with filename, allow retry |
| Export fails | Show error toast with details |

### Edge Cases

| Case | Behavior |
|------|----------|
| All photos skipped (0 selected) | Summary shows "0 selected" in muted style, export still works |
| All photos selected (0 skipped) | Summary shows "0 skipped" in muted style, export still works |
| Navigate to reviewed photo | Show existing status badge, existing tags |
| Change decision on reviewed photo | Update in memory + debounced save to IndexedDB |
| Resume with different folder structure | Detect mismatch, prompt user |

---

## Testing Decisions

### What makes a good test
- Tests external behavior only (user-visible outcomes)
- No internal implementation details
- Tests IndexedDB operations by mocking the store
- Tests export generation by verifying blob content

### Modules to test (by priority)

| Module | Priority | Test coverage |
|--------|----------|---------------|
| `ChipInput` | High | Comma parsing, chip creation, removal, autocomplete filtering |
| `export` | High | Correct file content, correct filenames |
| `image-utils` | Medium | Aspect ratio calculation, rotation normalization |
| `db` | Medium | Project CRUD, global people CRUD |
| `useKeyboardShortcuts` | Medium | Key mapping, focus-aware disabling |

### Prior art
- Use Vitest + React Testing Library as in standard Vite projects
- Mock IndexedDB with `idb` library's test utilities

---

## Out of Scope

- Touch/swipe gestures for photo navigation
- Multiple export formats (CSV, JSON only)
- Editing existing photos
- Cloud sync or multi-device support
- Photo filtering/search within folder
- Adding new photos to already-started folder
- Photo compression/resizing
- Adding new photos to in-progress folder

---

## Further Notes

1. **Photo Sort Order:** Alphabetical by filename for consistency and alignment with export order
2. **Rotation:** Always clockwise 90° increments (0° → 90° → 180° → 270° → 0°)
3. **Aspect Ratio:** Analyzed once on folder open; all photos display in that container
4. **People Badges:** Horizontal scrollable row at bottom center of image
5. **Keyboard Shortcuts:** Active only when not typing in chip input (focus guard)
6. **No Persistent Folder Handle:** Must re-request permission on each resume for security
7. **Memory Management:** LRU cache for loaded images (max 10 blob URLs)