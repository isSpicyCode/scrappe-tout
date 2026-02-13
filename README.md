# Scrappe-Tout

[![French Version](https://img.shields.io/badge/🇫🇷_Version-Française-blue)](./README_fr.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/github/package-json/v/isSpicyCode/scrappe-tout)](https://github.com/isSpicyCode/scrappe-tout)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](./tests/)

Ultra-fast web scraper with Playwright that converts HTML pages to clean Markdown format. Designed for documentation archiving and RAG (Retrieval-Augmented Generation) workflows.

**Works seamlessly in:**
- Interactive terminals (bash, zsh, fish, etc.) with TUI menu
- Claude Code / AI coding assistants (auto-detects non-interactive mode)
- CI/CD pipelines and automated workflows

## Features

- **High Performance**: Averages 0.8-1.2 seconds per URL using Playwright
- **Clean Output**: Removes navigation menus, duplicated tables of contents, and unnecessary elements
- **Smart Filenames**: Generates short, readable filenames from URL paths
- **Hybrid Mode**: Automatically detects interactive terminal vs non-interactive environments
- **Resource Blocking**: Blocks 10+ resource patterns (ads, analytics, tracking) for faster scraping
- **Markdown Optimization**: Single table of contents preserved for RAG applications
- **Batch Processing**: Process multiple URLs sequentially with progress tracking

## Requirements

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/) or install via package manager:
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # macOS (with Homebrew)
  brew install node
  
  # Or use nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  ```
- npm or yarn (included with Node.js)

## Installation

```bash
# Clone the repository
git clone https://github.com/isSpicyCode/scrappe-tout.git
cd scrappe-tout

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Usage

### Quick Start

1. Add your URLs to scrape in the `urls.txt` file (one URL per line):
```
https://example.com/docs/getting-started
https://example.com/docs/installation
https://example.com/docs/architecture
```

2. Run the scraper:
```bash
npm start
```

**Progress Display:**
```
[1/30] [100%] [████████████████████████████] https://example.com/docs/getting-started (1s)
[2/30] [100%] [████████████████████████████] https://example.com/docs/installation (1s)
[3/30] [100%] [████████████████████████████] https://example.com/docs/architecture (1s)
```
Each URL shows its individual progress bar reaching 100%, then moves to the next line.

### Interactive Mode (Terminal)

When running in an interactive terminal, the behavior depends on whether a `scrap-folder-name.txt` file exists:

**If `scrap-folder-name.txt` exists:**
- The folder name from the file is used automatically
- The menu is bypassed

**If no `scrap-folder-name.txt` file:**
- A TUI menu appears for folder selection:

```
============================================================
  FOLDER MENU - Select an option
============================================================
  Existing folders:
    1. my-files-docs
    2. scrap [default]

  Options:
    N - Create new folder (default: "scrap")
    D - Use default folder
    X - Delete existing folder
    Q - Quit
============================================================
Your choice:
```

Options:
- **N**: Create a new folder with custom name
- **D**: Use default "scrap" folder
- **1, 2, ...**: Use existing folder
- **X**: Delete an existing folder
- **Q**: Quit

### Non-Interactive Mode (Claude Code, CI)

In non-interactive environments (Claude Code, CI/CD), the folder name is determined automatically:

**Priority order:**
1. **`scrap-folder-name.txt` file** (if exists)
   ```bash
   # Create folder name file
   echo "my-documentation" > scrap-folder-name.txt
   
   # Run scraper
   npm start
   ```

2. **Auto-generated timestamp** (if no file exists)
   - Automatically creates a timestamped folder (e.g., `scrap-2026-02-13T10-49-30`)
   - Ensures no conflicts between runs

### Folder Name Priority

The scraper determines the folder name in this order:
1. 🥇 **`--name` flag** (if provided) - Highest priority
2. 🥈 **`scrap-folder-name.txt` file** (if exists) - Works in both interactive and non-interactive modes
3. 🥉 **Interactive menu** (if terminal is interactive AND no file exists)
4. ⏰ **Timestamp** (fallback if nothing else is available)

### Command-Line Options

```bash
# Specify custom output directory
npm start -- --output-dir /path/to/output

# Show help
npm start -- --help
```

## Output Structure

```
captures/
├── my-files-docs/
│   ├── inspector.md
│   ├── memory.md
│   ├── performance.md
│   └── ...
└── scrap-2026-02-13T10-49-30/
    ├── ui.md
    ├── components.md
    └── ...
```

Each URL generates a single Markdown file with:
- Clean content (no navigation, ads, or clutter)
- Preserved table of contents for RAG applications
- Short filename based on the last URL path segment

## Configuration

### Resource Blocking

The scraper automatically blocks these resource patterns for faster loading:
- Analytics and tracking scripts
- Advertisement networks
- Social media widgets
- Fonts and stylesheets from CDNs
- Images (can be enabled in config)

### Customize Blocked Resources

Edit `src/core/scraper.js` to modify the `RESOURCE_PATTERNS` array.

## Performance

| Metric | Value |
|--------|-------|
| Average per URL | 0.8-1.2 seconds |
| HTML compression | 80-95% size reduction |
| Conversion speed | 10-20x faster than single-file scripts |
| Parallel processing | Sequential (prevents rate limiting) |

## Project Structure

```
scrappe-tout/
├── src/
│   ├── core/
│   │   ├── scraper.js          # Playwright scraping logic
│   │   ├── converter.js        # HTML to Markdown conversion
│   │   ├── writer.js           # File writing with smart naming
│   │   ├── postprocessor.js    # Content cleaning
│   │   ├── logger.js           # Logging utilities
│   │   └── navigation-cleaner.js   # Navigation patterns and removal
│   ├── services/
│   │   ├── config.js           # Configuration management
│   │   ├── retry.js            # Retry logic with exponential backoff
│   │   ├── error.js            # Error handling
│   │   ├── urls.js             # URL reading and validation
│   │   ├── pipeline.js         # Scraping pipeline orchestration
│   │   └── path.js             # Output directory management
│   ├── utils/
│   │   ├── cli.js              # Command-line argument parsing
│   │   ├── menu.js             # Interactive TUI menu
│   │   ├── display.js          # Duration formatting and progress bar
│   │   ├── stats.js            # Statistics generation
│   │   ├── timestamp.js        # Timestamp utilities
│   │   └── constants.js        # Application constants
│   └── index.js                 # Main entry point (orchestration only)
├── tests/
│   ├── e2e/
│   │   └── scraping.test.js     # End-to-end workflow tests
│   ├── unit/
│   │   ├── cli.test.js         # CLI parser tests
│   │   ├── display.test.js     # Display utilities tests
│   │   └── stats.test.js       # Statistics tests
│   └── fixtures/
│       └── test-urls.txt       # Sample URLs for testing
├── urls.txt                     # URLs to scrape (one per line)
├── scrap-folder-name.txt        # Custom output folder name
└── package.json
```

## Acknowledgments

Built with:
- [Playwright](https://playwright.dev/) - Fast and reliable web automation
- [mdream](https://www.npmjs.com/package/mdream) - HTML to Markdown conversion
- [Biome](https://biomejs.dev/) - Linting and formatting

## Troubleshooting

### Playwright browsers not installed
```bash
npx playwright install chromium
```

### Permission errors on Linux
```bash
# Install required dependencies
sudo npx playwright install-deps chromium
```

### Empty or failed scrapes
- Check that URLs in `urls.txt` are accessible
- Some sites may require authentication or block automated access
- Try adding delays or reducing concurrency for rate-limited sites

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## License

MIT License - see LICENSE file for details.

Copyright (c) 2026 Spicycode - Scrappe-Tout Contributors
