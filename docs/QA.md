# Local preview verification — 29 October 2026

This record captures local pre-publication testing. The live app link is in README. No other apps/repositories/accounts were changed by these tests.

## Automated checks

- 18 model, rate arithmetic, invalid input, signature escaping/link schemes,
  Docker entry injection, canonical license preservation, image size/name checks.
- 18 CSV grammar, JSON safety/round-trip, numeric sorting, pagination, export
  formula protection, duplicate headings, headerless/ragged rows and table limits.
- ZIP path/UTF-8/exact filename checks. Actual downloaded archives independently
  verified with Python's standard zipfile reader and CRC checks.

## Actual browser tests

- Six tabs selectable at 390px and desktop preview; source/inputs remain local.
- Image input, conversion and real file downloads in WebP, JPG and PNG.
  Native decoder checks: WebP 512×512; 320×160 transparent test image resized to
  160×80, JPEG transparent corner becomes white, PNG alpha remains transparent.
  PNG quality slider disabled; output preview and file size feedback work.
- Rate result displays correctly; real TXT download matches displayed estimate.
- Python Dockerfile template and entry file work; a manually edited config
  survives switching to Rates and back. Downloaded ZIP contains exact .gitignore
  bytes from the bundled Node template, with no renamed extension.
- Signature live preview and HTML output render escaped values. Rich Clipboard
  API resolves and reports success. The IAB virtual clipboard cannot independently
  read/paste this native Clipboard API payload; actual Gmail/Outlook paste and
  email-client rendering remain unverified. HTML download remains available.
- CSV example: 62 rows / three pages; filter Done yields 16 rows / one page.
  Sort control updates, worker stays active, actual filtered JSON download has
  all 16 correct records. A JSON file with nested objects and __proto__ key
  loads; literal script-looking text stays text, with no injected script node.
- A real 50,000-row CSV opens in the browser worker; filtering even yields
  25,000 rows and 1,000 pages at 25 rows per page. This verifies functional
  upper-bound handling; it is not a controlled latency benchmark.
- Full GPL selector: 35,149 characters, FSF copyright unchanged, GPL-3.0-only
  notice separate. Actual ZIP download contains byte-identical full official
  GPL and a separate COPYRIGHT-NOTICE.txt. Other three official license sources
  loaded and model-tested.

## Corrections caught during QA

- Ordinary direct-app downloads are verified. Downloads initiated inside the
  iframe preview could not be delivered in this IAB. Preview mode now hands a
  local Blob to its same-origin parent and shows a fixed, visible Save file bar;
  clicking that parent control produced a real verified WebP download. Sender
  origin/frame and Blob type are checked. No file is sent to a server. The full
  app uses ordinary downloads or native file share on capable iPhones/iPads.
- IAB assigned a stray MIME-derived extension to an extensionless plain text
  filename. Config/license ZIP packaging preserves actual Dockerfile/.gitignore/
  LICENSE names across download handlers, verified by independent extraction.
- Returning to Configs no longer regenerates over user edits.
- Save image action moved alongside preview controls, above comparison images.
- File inputs are activated by accessible visible buttons; duplicate offscreen
  native file controls are excluded from keyboard navigation.

## Limits

Preview frames simulate 1366×900, 768×1024 and 390×844 CSS viewports, not physical
iPhone/iPad certification. iOS file share/saving, Gmail/Outlook and Docker builds
have not been run. Dockerfile outputs are editable starters with assumptions
shown in the UI. File data is in page memory, without persistence/cloud sync.
