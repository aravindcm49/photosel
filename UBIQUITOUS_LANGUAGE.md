# Ubiquitous Language

## Photo Review Lifecycle

| Term         | Definition                                           | Aliases to avoid             |
|--------------|------------------------------------------------------|------------------------------|
| **Photo**    | A single image file in a project folder              | Image, picture, file         |
| **Project**  | A named folder of photos opened for review           | Album, session, collection   |
| **Viewed**   | A photo that has been acted on (selected or skipped) | Reviewed, seen, processed    |
| **Selected** | A photo marked for keeping by the reviewer           | Chosen, approved, kept       |
| **Skipped**  | A photo explicitly rejected by the reviewer          | Rejected, discarded, ignored |
| **Unviewed** | A photo that has not yet been acted on               | Pending, new, unseen         |

## Navigation & Position

| Term               | Definition                                                             | Aliases to avoid      |
|--------------------|------------------------------------------------------------------------|-----------------------|
| **Position**       | The current photo's ordinal index in the folder (e.g. "3 of 50")       | Index, counter, page  |
| **Overlay**        | A semi-transparent control bar rendered on top of the photo            | Bar, toolbar, HUD     |
| **Top overlay**    | The overlay bar at the top showing stats and rotate control            | Header, top bar       |
| **Bottom overlay** | The overlay bar at the bottom showing action controls (Skip, Tag, Add) | Footer, action bar    |
| **Side arrows**    | Navigation buttons on the left/right edges of the photo                | Chevrons, nav buttons |

## Tagging

| Term                 | Definition                                                   | Aliases to avoid             |
|----------------------|--------------------------------------------------------------|------------------------------|
| **Tag**              | A person's name attached to a photo                          | Label, person, chip          |
| **Chip**             | An inline rendered tag inside the input field                | Badge, pill, token           |
| **Suggestion**       | A previously used tag name offered as autocomplete           | Recommendation, autocomplete |
| **Committed tag**    | A tag that has been saved to the photo's data                | Saved tag, confirmed tag     |
| **Uncommitted text** | Typed text in the input that has not yet been saved as a tag | Pending input, draft         |

## Stats & Display

| Term              | Definition                                                        | Aliases to avoid                   |
|-------------------|-------------------------------------------------------------------|------------------------------------|
| **Stats badge**   | Compact overlay showing `(Selected : Skipped) / Total` with hover | Progress badge, counter, indicator |

## Persistence

| Term               | Definition                                                             | Aliases to avoid           |
|--------------------|------------------------------------------------------------------------|----------------------------|
| **Flush**          | Immediately persist all pending changes to storage, bypassing debounce | Force save, sync           |
| **Debounced save** | A delayed persistence triggered after a brief idle period (500ms)      | Auto-save, background save |

## Export

| Term                     | Definition                                                              | Aliases to avoid                    |
|--------------------------|-------------------------------------------------------------------------|-------------------------------------|
| **Download Selected**    | Export a text file listing all **Selected** photo filenames              | Export chosen, save picks           |
| **Download with Tags**   | Export a text file listing **Selected** photos with their **Tags**       | Download Selected with Map, export with people |
| **Download Skipped**     | Export a text file listing all **Skipped** photo filenames              | Export rejected, save skips         |
| **Download Both**        | Export both Selected and Skipped text files simultaneously              | Export all, full export             |

## Relationships

- A **Project** contains many **Photos**
- A **Photo** has exactly one status: **Unviewed**, **Selected**, or **Skipped**
- **Viewed** = **Selected** ∪ **Skipped** (any photo with a non-null status)
- A **Photo** can have zero or more **Tags** (people names)
- **Position** advances when a **Photo** is **Viewed** or navigated past
- **Flush** is called before navigating away from the review screen to ensure all **Viewed** states are persisted
- **Stats badge** sits in the **Top overlay** next to Back, showing `(Selected : Skipped) / Total` compactly with hover labels
- **Download with Tags** produces lines like `photo.jpg: Alice, Bob` — filename followed by colon and comma-separated **Tags**

## Example dialogue

> **Dev:** "The reviewer says the `(2 : 1) / 5` **Stats badge** is confusing — they can't tell what the numbers mean."
>
> **Domain expert:** "That's why the hover shows `(Selected : Skipped) / Total`. Green is **Selected**, red is **Skipped**, and the total is all **Photos** in the **Project**."
>
> **Dev:** "Got it. Now for the summary screen — what's the difference between **Download Selected** and **Download with Tags**?"
>
> **Domain expert:** "**Download Selected** gives you just filenames: `a.jpg`, `c.jpg`. **Download with Tags** appends the people: `a.jpg: Alice`, `c.jpg: Bob, Charlie`. If a **Photo** has no **Tags**, it's just the filename."
>
> **Dev:** "So **Download Both** uses the plain format — no tags?"
>
> **Domain expert:** "Correct. **Download Both** gives you **Selected.txt** (filenames only) and **Skipped.txt** (filenames only). Tags are only in **Download with Tags**."

## Flagged ambiguities

- **"Reviewed"** was used interchangeably with **Viewed** in the original codebase. The term **Viewed** is now canonical — it means "the user has taken an explicit action (selected or skipped) on this photo." Simply navigating to a photo does not make it **Viewed**.
- **"Badge"** was used for both the inline tags in the input (now called **Chips**) and overlay indicators. These are now distinct: a **Chip** is a person's name in the input; a **Stats badge** shows counts.
- **"Uncommitted"** was previously overloaded to mean both "has chips that differ from the saved state" and "has typed text not yet converted to a chip." Now **Uncommitted text** refers only to half-typed input; chips are always committed state.
- **"Export"** was previously a single combined action. Now **Download Selected**, **Download with Tags**, **Download Skipped**, and **Download Both** are distinct actions — avoid using "export" alone without specifying which.
- **"Map"** was briefly used for the tag-enriched export (as in "person-to-photo mapping"). The canonical term is **Download with Tags** — avoid "Download with Map."
