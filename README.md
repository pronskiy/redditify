# Reddit Thread Viewer

A TypeScript package that allows rendering arbitrary Reddit threads on any webpage. The package fetches JSON data from Reddit and renders a UI that closely resembles the original Reddit thread design.

## Features

- 🧵 Render any Reddit thread by providing its URL
- 🎨 Styled with Tailwind CSS and shadcn/ui components
- 🔄 Automatically fetches thread data from Reddit's JSON API
- 📱 Responsive design that works on mobile and desktop
- 🌙 Supports light and dark mode
- 🧩 Easy to embed on any webpage

## Installation

```bash
npm install reddit-thread-viewer
# or
yarn add reddit-thread-viewer
# or
pnpm add reddit-thread-viewer
```

## Usage

### Basic Usage

```jsx
import { RedditThread } from 'reddit-thread-viewer';
import 'reddit-thread-viewer/dist/style.css'; // Import styles

function App() {
  return (
    <div className="container mx-auto p-4">
      <RedditThread 
        url="https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload"
      />
    </div>
  );
}
```

### Advanced Usage

```jsx
import { RedditThread } from 'reddit-thread-viewer';
import 'reddit-thread-viewer/dist/style.css'; // Import styles

function App() {
  return (
    <div className="container mx-auto p-4">
      <RedditThread 
        url="https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload"
        maxCommentDepth={3} // Limit comment nesting depth
        showPostContent={true} // Show or hide the post content
        showCommentControls={true} // Show or hide comment controls
        className="my-custom-class" // Add custom classes
        onError={(error) => console.error('Error loading thread:', error)}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | (required) | URL of the Reddit thread to render |
| `maxCommentDepth` | `number` | `5` | Maximum depth of nested comments to display |
| `showPostContent` | `boolean` | `true` | Whether to show the post content |
| `showCommentControls` | `boolean` | `true` | Whether to show comment controls (collapse, etc.) |
| `className` | `string` | `undefined` | Additional CSS classes to apply to the container |
| `onError` | `(error: Error) => void` | `undefined` | Callback function when an error occurs |

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/reddit-thread-viewer.git
cd reddit-thread-viewer

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
# Navigate to the demo directory
cd demo

# Start the demo server
npm run dev
```

## License

MIT
