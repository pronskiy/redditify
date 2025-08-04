# Redditify

A vanilla JavaScript package that allows rendering arbitrary Reddit threads on any webpage. 

The package fetches JSON data from Reddit and renders a UI that resembles the original Reddit thread design.

## Features

- 🧵 Render any Reddit thread by providing its URL
- 💫 No Reddit API key needed
- 🍦 Vanilla JS, ony 1 external dependency
- 📱 Responsive design that works on mobile and desktop
- 🧩 Easy to embed on any webpage
- 📂 Collapsible comments - hide/show comment content and replies
- 🔗 Optional attribution link - can be turned on/off

## Installation

```bash
npm install redditify
# or
yarn add redditify
# or
pnpm add redditify
```

### CDN Usage

For quick implementation without npm, you can use the CDN version:

```html
<!-- Include from CDN -->
<script src="https://cdn.jsdelivr.net/npm/redditify/dist/redditify.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/redditify/dist/redditify.css">
```

## Usage

### Auto-Embedding Script

You can use the auto-embedding script to automatically render Reddit threads on any HTML page without writing any JavaScript code. This is the simplest way to embed Reddit threads on your website.

#### Basic Usage

1. Include the Reddit Thread Viewer script and css:

```html
<script src="//unpkg.com/redditify/dist/redditify.min.js"></script>
<link rel="stylesheet" href="//unpkg.com/redditify/dist/redditify.css">
```

2. Add divs with the `data-reddit-thread` attribute:

```html
<div 
  data-reddit-thread="https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload"
></div>
```

#### Complete HTML Example

Here's a complete HTML example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reddit Thread Example</title>
  <!-- Include Redditify -->
  <script src="https://unpkg.com/redditify/dist/redditify.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/redditify/dist/redditify.css">
</head>
<body>
  <h1>Reddit Thread Example</h1>
  
  <!-- Reddit thread will be rendered here -->
  <div 
    data-reddit-thread="https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload"
    data-reddit-max-depth="5"
    data-reddit-show-content="true"
    data-reddit-show-controls="true"
  ></div>
</body>
</html>
```

#### Advanced Usage

You can customize the thread display with additional data attributes:

```html
<div 
  data-reddit-thread="https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload"
  data-reddit-max-depth="3"
  data-reddit-show-content="true"
  data-reddit-show-controls="true"
  data-reddit-show-attribution="true"
></div>
```

### JavaScript API Usage

If you need more control, you can use the JavaScript API directly:

```javascript
import { createRedditThread } from 'redditify';
import 'redditify/dist/redditify.css'; // Import styles

// Get a container element
const container = document.getElementById('thread-container');

// Render the Reddit thread
createRedditThread({ 
  url: 'https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload',
  maxCommentDepth: 3, // Limit comment nesting depth
  showPostContent: true, // Show or hide the post content
  showCommentControls: true, // Show or hide comment controls
  showAttribution: true, // Show or hide attribution link
  onError: (error) => console.error('Error loading thread:', error)
}, container);
```

#### Available Data Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-reddit-thread` | URL | (required) | URL of the Reddit thread to render |
| `data-reddit-max-depth` | Number | `5` | Maximum depth of nested comments to display |
| `data-reddit-show-content` | Boolean | `true` | Whether to show the post content |
| `data-reddit-show-controls` | Boolean | `true` | Whether to show comment controls |
| `data-reddit-show-attribution` | Boolean | `true` | Whether to show the attribution link at the bottom |

### Collapsible Comments

Redditify supports collapsible comments. Users can click the [-] button next to a comment author to collapse both the comment content and its replies. This is particularly useful for long threads with many nested comments.

### Attribution Link

By default, Redditify adds a small attribution link at the bottom of the widget. You can disable this by setting `data-reddit-show-attribution="false"` or `showAttribution: false` in the JavaScript API.

## JavaScript API Options

When using the `createRedditThread` function, you can pass the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | (required) | URL of the Reddit thread to render |
| `maxCommentDepth` | `number` | `5` | Maximum depth of nested comments to display |
| `showPostContent` | `boolean` | `true` | Whether to show the post content |
| `showCommentControls` | `boolean` | `true` | Whether to show comment controls (collapse, etc.) |
| `showAttribution` | `boolean` | `true` | Whether to show the attribution link at the bottom |
| `onError` | `(error: Error) => void` | `undefined` | Callback function when an error occurs |

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/pronskiy/redditify.git
cd redditify

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

### Run Demo

```bash
# Run the demo server
npm run demo
```

## Dependencies

Redditify has minimal dependencies:

- `date-fns` - For date formatting

No framework dependencies (like React, Vue, or Angular) are required.

## License

MIT
