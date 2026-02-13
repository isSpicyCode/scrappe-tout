# E2E Tests for Scrappe-Tout

## Structure

```
tests/
├── e2e/
│   └── scraping.test.js    # Main e2e test suite
├── fixtures/
│   ├── test-urls.txt       # Sample URLs for testing
│   └── expected/            # Expected outputs (optional)
└── unit/
```

## Running Tests

```bash
# Run all tests
npm test

# Run only e2e tests
node --test tests/e2e/*.test.js

# Run with verbose output
node --test --experimental-test-coverage
```

## Test Coverage

- Basic scraping functionality
- File naming and path handling
- Markdown quality (navigation removal, TOC deduplication)
- Error handling (missing files, empty URLs)
- Output directory management
- CLI help and options
- Statistics reporting
- Progress display

## Notes

- Tests use real HTTP requests to example.com, example.org
- Output directories are created in `captures/` and cleaned up after tests
- Each test creates a unique output folder to avoid conflicts
- Tests use `scrap-folder-name.txt` for non-interactive mode
