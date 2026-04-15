# Wedding Photo Selector

**Date:** 15-APR-26  
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

### Photo Review
7. As a user, I want to see one photo at a time in a full-screen view, so that I can focus on each image
8. As a user, I want to press arrow keys (← →) to navigate between photos, so that I can move quickly
9. As a user, I want auto-advance after pressing Skip or Add to List, so that momentum is maintained
10. As a user, I want a Previous button (and ← key) to go back and review/edit past decisions, so that I can change my mind
11. As a user, I want a progress indicator showing "X/Y reviewed", so that I know how far I've gotten
12. As a user, I want to see the summary screen when all photos are reviewed, so that I can export my selections

### Photo Actions
13. As a user, I want to press `S` or click "Skip" to mark a photo as skipped, so that I can move on quickly
14. As a user, I want to press `A` or click "Add to List" to mark a photo as selected, so that I can build my list
15. As a user, I want to see a colored status badge (green ✓ Selected / red ✗ Skipped) at the top-right of the current photo, so that I instantly know the photo's state
16. As a user, I want to press `R` or click a Rotate button to rotate the photo 90° clockwise, so that I can correct orientation issues
17. As a user, I want my rotation to be saved and restored when navigating, so that orientation persists

### People Tagging
18. As a user, I want to press `T` or focus the chip input to tag people in the current photo, so that I can track who appears
19. As a user, I want to type names in a chip input that shows autocomplete from previously used names, so that I can tag quickly
20. As a user, I want to type multiple names separated by commas and have them become separate chips, so that I can add multiple people at once
21. As a user, I want to press Enter or comma to add a chip and start a new name entry, so that the flow is smooth
22. As a user, I want to click a chip to remove it, so that I can correct mistakes
23. As a user, I want people badges to appear at the bottom center of the photo AFTER I finish input (blur/Enter), so that the view is clean while typing
24. As a user, I want multiple name badges to display in a horizontal row with overflow scroll, so that all names are visible
25. As a user, I want the people tags saved to IndexedDB for the current photo, so that they persist on resume

### Export
26. As a user, I want to click an Export button on the summary screen, so that I can get my final lists
27. As a user, I want two separate files exported: `Selected.txt` and `Skipped.txt`, so that the photographer gets clean lists
28. As a user, I want files to contain just the filenames (one per line), so that they're easy to use
29. As a user, I want the export to trigger a browser download to my Downloads folder, so that no special permissions are needed

### Keyboard Shortcuts
30. As a user, I want to use `←` and `→` for navigation, so that I can move quickly without reaching for the mouse
31. As a user, I want to use `S` for Skip, `A` for Add, `T` for Tag input, and `R` for Rotate, so that I can operate entirely from the keyboard

---

## Implementation Decisions

### Screens
- **Home Screen**: Displays saved folders as cards with folder name, progress ("42/156 reviewed"), Resume button, and Delete button. Empty state shows "No projects yet" + "Open Folder" button.
- **Photo Review Screen**: Full photo view with translucent overlays. Shows progress at top, status badge top-right, rotate button top-left, action bar at bottom center.
- **Summary Screen**: Shows total selected and skipped counts with "Export Selected.txt & Skipped.txt" download button.

### Layout
- Photo container: Letterboxed to analyzed aspect ratio from all photos in folder, no black bars, fit content
- Top-left overlay: Rotate button (icon only, frosted glass)
- Top-right overlay: Status badge (color + icon)
- Bottom center overlay: Frosted glass bar with `[Skip] [Chip Input (center)] [Add to List]`
- People name badges: Displayed horizontally at bottom center of the image, above the input bar
- Bottom flanking: Previous/Next buttons (or hidden, rely on arrow keys)

### Data Model (IndexedDB)
- **Store: `projects`** — Key: folder name (string)
  ```typescript
  {
    folderName: string,
    totalPhotos: number,
    reviewedCount: number,
    folderHandle: FileSystemDirectoryHandle, // persisted for resume
    photos: {
      [filename: string]: {
        filename: string,
        status: 'selected' | 'skipped' | null,
        people: string[],
        timestamp: number,
        rotation: number // degrees (0, 90, 180, 270)
      }
    }
  }
  ```
- **Store: `globalPeople`** — Array of all person names used across photos for autocomplete

### Modules to Build

1. **HomeScreen** (`/screens/HomeScreen.tsx`)
   - Lists saved projects from IndexedDB
   - Handles folder selection and deletion
   - Entry point for new sessions

2. **PhotoReviewScreen** (`/screens/PhotoReviewScreen.tsx`)
   - Main review interface
   - Manages photo navigation and state
   - Orchestrates child components

3. **PhotoViewer** (`/components/PhotoViewer.tsx`)
   - Displays single photo with rotation support
   - Handles letterboxing
   - Manages preload of next 3-5 photos

4. **ActionBar** (`/components/ActionBar.tsx`)
   - Contains Skip, Add to List buttons
   - Contains chip input for people tagging
   - Manages blur/Enter to confirm tags

5. **ChipInput** (`/components/ChipInput.tsx`)
   - Autocomplete from global people list
   - Comma-separated parsing into chips
   - Removable chips on click

6. **StatusBadge** (`/components/StatusBadge.tsx`)
   - Shows Selected (green check) or Skipped (red x) at top-right

7. **ProgressIndicator** (`/components/ProgressIndicator.tsx`)
   - Shows "X/Y reviewed" progress

8. **RotateButton** (`/components/RotateButton.tsx`)
   - Rotate 90° clockwise button at top-left

9. **SummaryScreen** (`/screens/SummaryScreen.tsx`)
   - Shows final counts
   - Export button triggers download

10. **indexedDB** (`/lib/indexedDB.ts`)
    - Project CRUD operations
    - Global people list management
    - Folder handle persistence

11. **export** (`/lib/export.ts`)
    - Generates Selected.txt and Skipped.txt blobs
    - Triggers browser download

12. **aspectRatioAnalyzer** (`/lib/aspectRatioAnalyzer.ts`)
    - Analyzes all photos to determine optimal display aspect ratio

### Technical Decisions
- **Framework**: React with Vite
- **UI Library**: shadcn
- **Icons**: Lucide React
- **Storage**: IndexedDB (via idb wrapper or native)
- **File Access**: File System Access API (showDirectoryPicker)
- **Export**: Browser download API (createObjectURL + anchor click)
- **Keyboard**: useEffect with keydown listener, cleanup on unmount

---

## Testing Decisions

### What makes a good test
- Tests external behavior only (user-visible outcomes)
- No internal implementation details
- Tests IndexedDB operations by mocking the store
- Tests export generation by verifying blob content

### Modules to test
- **ChipInput**: Verify comma parsing, chip creation, removal, autocomplete trigger
- **export**: Verify correct file content generation
- **aspectRatioAnalyzer**: Verify correct ratio calculation

### Prior art
- Use Vitest + React Testing Library as in standard Vite projects

---

## Out of Scope

- Touch/swipe gestures for photo navigation
- Multiple export formats (CSV, JSON only)
- Editing existing photos
- Cloud sync or multi-device support
- Photo filtering/search within folder
- Adding new photos to already-started folder

---

## Further Notes

- Photos are sorted alphabetically by filename for consistency
- Rotation is always clockwise 90° increments, cycling through 0° → 90° → 180° → 270° → 0°
- The aspect ratio is analyzed once on folder open; all photos display in that container
- People chips display horizontally in a scrollable row at bottom center of image
- Keyboard shortcuts (`S`, `A`, `T`, `R`) are always active when on the review screen
- Export order in .txt files matches alphabetical photo order