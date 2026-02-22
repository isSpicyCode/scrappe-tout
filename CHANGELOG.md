# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-13

### Added
- Ultra-fast web scraper with Playwright (0.8-1.2s per URL)
- HTML to Markdown conversion optimized for RAG workflows
- Interactive TUI menu for folder selection (terminals)
- Automatic non-interactive mode detection (Claude Code, CI/CD)
- CLI options: `--output-dir`, `--name`, `--help`
- Resource blocking (10+ patterns: ads, analytics, tracking)
- Smart filename generation from URL paths
- Sequential batch processing with progress tracking
- Clean output: removes nav menus, duplicated TOCs, unnecessary elements
- Single preserved table of contents for RAG applications
- French documentation (README_fr.md)

### Fixed
- HTML compression: 80-95% size reduction
- Folder name priority: flag > file > menu > timestamp

### Technical
- Node.js 18+ required
- Playwright chromium browser
- Biome for linting and formatting
- Unit and E2E tests included
