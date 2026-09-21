# Share link copy fix

The Share link action currently sends a title, descriptive text, and URL to the system share sheet. On iOS, the system Copy action can prefer the descriptive text, so the clipboard does not contain the promised link.

Keep the existing system share interaction, but make the canonical URL the only shared content item. The title remains UI metadata for the share dialog. Apply this once in the shared native helper so chapter cards and all Tao in everyday life entry points behave consistently on H5 and iOS. Browser fallback continues to copy the exact URL directly.

Verify the chapter share payload contains the exact canonical URL and no `text` field, then exercise a representative essay link and poster flow. Preserve image-only sharing and all unrelated share controls.
