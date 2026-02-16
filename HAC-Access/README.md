# HAC Access Portal

A unified cyberpunk boot/authentication experience for the Hult AI Collective. Combines SAM's terminal boot sequence with ctOS-style login greeter, creating an immersive entry experience for club members.

## Quick Start

1. Open `index.html` in a browser
2. Watch the terminal boot sequence
3. See the HAC title screen with glitch animation
4. Enter any password in the login field (demo accepts anything)
5. Press ENTER to confirm → redirects to dashboard

## URL Parameters

| Parameter | Description |
|-----------|-------------|
| `?skip` | Skip boot sequence, go directly to greeter |
| `?fast` | 2x speed boot sequence |
| `?ultrafast` | 5x speed (development mode) |
| `?silent` | Mute all audio |
| `?noredirect` | Skip redirect after auth (testing) |

## Files Structure

```
HAC-Access/
├── index.html          # Main entry point
├── dashboard.html      # Redirect target (placeholder)
├── css/
│   ├── theme.css       # Color scheme & variables
│   ├── main.css        # Base styles, CRT effects
│   ├── boot_screen.css # SAM-style boot animation
│   ├── greeter.css     # ctOS-style components
│   └── animations.css  # Keyframe animations
├── js/
│   ├── main.js         # Main orchestration engine
│   └── audio.js        # AudioManager class
└── assets/
    ├── boot_log.txt    # Boot sequence messages
    ├── fonts/          # WOFF2 font files
    └── audio/          # Sound effects (WAV)
```

## Customization

### Theme Colors

Edit `css/theme.css` to change the accent color:

```css
:root {
    --color_r: 0;    /* Red: 0-255 */
    --color_g: 212;  /* Green: 0-255 */
    --color_b: 212;  /* Blue: 0-255 */
}
```

**Preset themes:**
- HAC Cyan (default): `r:0, g:212, b:212`
- Tron: `r:170, g:207, b:209`
- Matrix: `r:0, g:255, b:65`
- Blade Runner: `r:255, g:60, b:90`

### Redirect URL

Edit `js/main.js` CONFIG object:

```javascript
const CONFIG = {
    redirectUrl: './dashboard.html',  // Change this
    // ...
};
```

### Boot Messages

Edit `assets/boot_log.txt` to customize the terminal boot log.

### App Name

Change branding in `js/main.js`:

```javascript
const CONFIG = {
    appName: 'HAC',  // Change this
    // ...
};
```

## Flow States

1. **BOOT** - Terminal scrolling boot log
2. **BOOT_TITLE** - HAC logo with glitch animation
3. **SPLASH** - Progress bar animation
4. **STARTUP** - Password field appears
5. **IDLE** - Waiting for input
6. **LOADING** - Spinner animation
7. **SUCCESS** - Identity card reveal
8. **CONFIRM_WAIT** - Press ENTER prompt
9. **EXIT** - Final animation
10. **REDIRECT** - Navigate to dashboard

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Requires JavaScript enabled and supports Web Animations API.

## Credits

- Boot sequence inspired by [eDEX-UI](https://github.com/GitSquared/edex-ui)
- Greeter style inspired by Watch Dogs ctOS interface
- Built for Hult AI Collective

---

HAC-OS v2.0.0 // HULT AI COLLECTIVE
