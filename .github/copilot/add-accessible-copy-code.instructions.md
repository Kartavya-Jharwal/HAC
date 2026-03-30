---
name: add-accessible-copy-code
description: Implements an accessible "Copy Code" button for code blocks using schema.org markup, encoded meta tags, and the Clipboard API.
---

# Add Accessible Copy Code Button

When adding a "Copy Code" button to code snippets, follow these guidelines to ensure it is accessible and robust for users relying on assistive technologies or voice commands.

## 1. HTML & Markup
- **Unique IDs**: Generate a unique ID for each code block on the page.
- **Schema.org**: Wrap the code block in a container with `itemscope` and `itemtype="https://schema.org/SoftwareSourceCode"`. Include relevant schema properties.
- **Hidden Raw Code**: Store the raw code safely inside a `<meta>` tag to avoid copying extraneous HTML syntax-highlighting tags. Use `encodeURIComponent` to prevent accidental execution.

```html
<div data-code-block itemscope itemtype="https://schema.org/SoftwareSourceCode">
  <meta itemprop="codeSampleType" content="snippet">
  <!-- Set programmingLanguage dynamically -->
  <meta itemprop="programmingLanguage" content="javascript">
  <!-- Encode the raw code and assign the unique ID -->
  <meta data-code-id="${uniqueId}" itemprop="text" content="${encodeURIComponent(rawCode)}">
  
  <!-- Formatted / syntax-highlighted code goes here -->
  <pre><code>...</code></pre>
</div>
```

## 2. The Button
- Place a `<button type="button" data-copy="${uniqueId}">Copy</button>` near or inside the code block.
- If using an icon instead of raw text, ensure the button has a descriptive `aria-label` (e.g., `aria-label="Copy code snippet"`).

## 3. CSS Accessibility
- Provide clear visual indicators for `:focus`, `:active`, and `:focus-visible` states so keyboard and voice-navigation users know which element is targeted.
- Position the button logically (e.g., absolutely at the top right of the code block).

## 4. JavaScript functionality
- Attach event listeners to all copy buttons to grab the unique ID.
- Retrieve the encoded string from the corresponding `<meta>` tag.
- Decode it using `decodeURIComponent` and copy it to the user's clipboard using `navigator.clipboard.writeText`.

```javascript
const copyButtons = document.querySelectorAll(`[data-copy]`);

copyButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    // Determine the unique ID from the clicked button
    const codeId = e.currentTarget.dataset.copy;
    
    // Find the corresponding meta tag containing the raw text
    const metaTag = document.querySelector(`[data-code-id="${codeId}"]`);
    if (metaTag) {
      const codeAsText = metaTag.getAttribute("content");
      // Decode and copy to clipboard
      navigator.clipboard.writeText(decodeURIComponent(codeAsText));
    }
  });
});
```
