# Boot Sequence - Plug & Play Splash Screen

A standalone boot/splash screen animation for tech projects, ported from [SAM Dashboard](https://github.com/GitSquared/edex-ui) (eDEX-UI).

![Boot Sequence Demo](../media/linuxIcons/boot-demo.gif)

## Features

- 🎬 Authentic sci-fi boot sequence animation
- 🎨 Fully customizable colors and branding
- 🔊 Optional audio effects
- ⚡ URL parameter controls (`?skip`, `?fast`, `?silent`)
- 📦 Zero dependencies - pure HTML/CSS/JS
- 🎯 Event-driven completion callbacks
- 📱 Responsive design

## Quick Start

1. **Copy the folder** into your project:
   ```
   your-project/
   ├── boot-standalone/   ← Copy this folder
   ├── index.html
   └── ...
   ```

2. **Link to it** as your splash page or embed it:
   ```html
   <!-- Option A: Use as splash page -->
   <a href="boot-standalone/index.html">Enter</a>
   
   <!-- Option B: Embed in iframe -->
   <iframe src="boot-standalone/index.html"></iframe>
   ```

3. **Customize** in `js/boot.js`:
   ```javascript
   const BOOT_CONFIG = {
       appName: 'MY PROJECT',
       version: '1.0.0',
       colors: { r: 0, g: 255, b: 136 },  // Green
       completionMode: 'redirect',
       redirectUrl: '/dashboard.html'
   };
   ```

## Configuration Options

Edit `BOOT_CONFIG` in `js/boot.js`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appName` | string | `'SAM'` | Project name shown in title screen |
| `version` | string | `'2.2.8'` | Version shown in boot log |
| `audio.enabled` | boolean | `true` | Enable/disable sound effects |
| `audio.volume` | number | `0.4` | Volume level (0.0 - 1.0) |
| `skipIntro` | boolean | `false` | Skip boot sequence entirely |
| `colors.r/g/b` | number | `170/207/209` | RGB accent color (0-255) |
| `completionMode` | string | `'ready'` | What happens when boot finishes |
| `redirectUrl` | string | `'/main.html'` | URL for redirect mode |
| `onComplete` | function | `null` | Custom callback function |
| `customBootLog` | array | `null` | Custom boot messages |
| `bootLogPath` | string | `'./assets/boot_log.txt'` | Path to boot log file |

### Completion Modes

- `'ready'` - Display "SYSTEM READY" message
- `'fade'` - Fade out and remove boot screen
- `'remove'` - Immediately remove boot screen
- `'redirect'` - Navigate to `redirectUrl`
- `'callback'` - Execute `onComplete` function

## URL Parameters

Control boot behavior via query parameters:

```
index.html?skip      # Skip the boot sequence
index.html?fast      # Run at 2x speed
index.html?silent    # Disable audio
index.html?skip&silent  # Combine parameters
```

## Events

Listen for boot completion:

```javascript
window.addEventListener('bootComplete', function(event) {
    console.log('Boot finished!', event.detail);
    // event.detail.config - Boot configuration
    // event.detail.skipped - true if ?skip was used
});
```

## External Configuration

Override config from outside the boot folder:

```html
<script>
    window.BOOT_CONFIG_OVERRIDE = {
        appName: 'NEXUS',
        colors: { r: 255, g: 60, b: 90 },
        onComplete: function(bootScreen) {
            bootScreen.remove();
            startMyApp();
        }
    };
</script>
<script src="boot-standalone/js/audio.js"></script>
<script src="boot-standalone/js/boot.js"></script>
```

## Theme Presets

Edit `css/theme.css` to change colors:

```css
:root {
    /* TRON (default) - Cyan */
    --color_r: 170;
    --color_g: 207;
    --color_b: 209;
    
    /* MATRIX - Green */
    /* --color_r: 0; --color_g: 255; --color_b: 65; */
    
    /* BLADE RUNNER - Red/Pink */
    /* --color_r: 255; --color_g: 60; --color_b: 90; */
    
    /* AMBER TERMINAL - Orange */
    /* --color_r: 255; --color_g: 176; --color_b: 0; */
    
    /* CYBERPUNK - Magenta */
    /* --color_r: 255; --color_g: 0; --color_b: 255; */
}
```

## Custom Boot Log

Create your own boot messages in `assets/boot_log.txt`:

```
Initializing NEXUS Core...
Loading neural networks...
Connecting to mainframe...
Quantum processors online...
Security protocols engaged...
Boot Complete
```

Or set programmatically:

```javascript
BOOT_CONFIG.customBootLog = [
    'Starting MyApp v2.0...',
    'Loading configuration...',
    'Initializing modules...',
    'Boot Complete'
];
```

## File Structure

```
boot-standalone/
├── index.html          # Entry point
├── README.md           # This file
├── css/
│   ├── boot_screen.css # Boot animation styles
│   ├── main.css        # Core styles
│   └── theme.css       # Theme colors & fonts
├── js/
│   ├── audio.js        # Audio manager
│   └── boot.js         # Boot sequence engine
└── assets/
    ├── boot_log.txt    # Boot messages
    ├── audio/          # Sound effects
    └── fonts/          # Web fonts
```

## Audio Files

The following audio files are used:
- `stdout.wav` - Line output beep
- `granted.wav` - "Boot Complete" success
- `theme.wav` - Title screen reveal

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT - Ported from [eDEX-UI](https://github.com/GitSquared/edex-ui) by Squared.

---

**Pro tip:** For the most authentic experience, view in fullscreen (F11) on a dark background! 🖥️
