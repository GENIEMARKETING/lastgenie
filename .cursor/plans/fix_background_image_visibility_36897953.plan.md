---
name: Fix Background Image Visibility
overview: Adjust opacity and overlay settings to make background images more visible in all sections. The current settings are too subtle, making the backgrounds nearly invisible.
todos:
  - id: "1"
    content: Increase Product Features background opacity from 30% to 50-60%
    status: pending
  - id: "2"
    content: Reduce Testimonials overlay from 85% to 50-60% to show paper texture
    status: pending
  - id: "3"
    content: Reduce Subscribe & Save gradient overlay intensity
    status: pending
  - id: "4"
    content: Verify Trust Indicators section visibility
    status: pending
---

# Fix Background Image Visibility Issues

## Problem Analysis

The background images are implemented but not visible due to:

1. **Product Features Section**: `opacity-30` (30% opacity) is too subtle
2. **Testimonials Section**: `bg-surface/85` (85% white overlay) almost completely hides the background
3. **Subscribe & Save**: Gradient overlay might be too strong
4. **Trust Indicators**: Should be visible but might need adjustment

## Solutions

### 1. Product Features Section (`client/src/app/page.tsx` line 69)

- **Current**: `opacity-30` (too subtle)
- **Fix**: Increase to `opacity-50` or `opacity-60` for better visibility while maintaining readability

### 2. Testimonials Section (`client/src/app/page.tsx` line 175)

- **Current**: `bg-surface/85` (85% white overlay - too opaque)
- **Fix**: Reduce to `bg-surface/60` or `bg-surface/50` to allow background texture to show through

### 3. Subscribe & Save CTA (`client/src/app/page.tsx` line 147)

- **Current**: `from-genie-blue/20 to-genie-teal/20` (20% opacity gradient)
- **Fix**: Reduce to `from-genie-blue/10 to-genie-teal/10` or remove entirely if background is light enough

### 4. Trust Indicators Section (`client/src/app/page.tsx` line 239)

- **Current**: No overlay (should be visible)
- **Fix**: Add subtle overlay if needed for text readability, or verify image is loading

## Additional Troubleshooting Steps

1. **Browser Cache**: User should do a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Dev Server**: Restart Next.js dev server if changes don't appear
3. **Image Paths**: Verify paths are correct (already confirmed - images are accessible)

## Implementation

Update opacity and overlay values in `client/src/app/page.tsx`:

- Line 69: Change `opacity-30` to `opacity-50` or `opacity-60`
- Line 175: Change `bg-surface/85` to `bg-surface/50` or `bg-surface/60`
- Line 147: Change gradient overlay from `/20` to `/10` or remove
- Verify Trust Indicators section has proper z-index and no conflicting styles