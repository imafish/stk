# Configuration

STK stores user configuration in `chrome.storage.local`.

## Storage Keys

These keys are defined in `src/common/types.ts`.

| Key                 | Purpose                                        | Used By                                                                                   |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `stk_kindle_email`  | Kindle destination email for send flow         | `src/options/options.ts`, `src/popup/delivery.ts`                                         |
| `stk_emailjs_key`   | EmailJS public key                             | `src/options/options.ts`, `src/popup/delivery.ts`                                         |
| `stk_kindle_device` | Selected Kindle device preset                  | `src/popup/popup.ts`                                                                      |
| `stk_font_settings` | Typography defaults and current popup values   | `src/options/options.ts`, `src/popup/popup.ts`, `src/epub/generator.ts`                   |
| `stk_domain_list`   | Domain selector override list for auto capture | `src/options/options.ts`, `src/background/background.ts`, `src/background/domain-list.ts` |

## Extension Permissions

Defined in `manifest.json`:

- `activeTab`: allows actions on the current active tab
- `scripting`: injects `inject.js` and `inject.css` on demand
- `storage`: reads/writes user settings
- `contextMenus`: adds right-click STK menu actions

## Popup Configuration Controls

Configured in `src/popup/popup.html` and applied in `src/popup/popup.ts`:

- Capture mode: Auto vs Manual
- Metadata fields:
  - Title
  - Author
  - Language
- Typography fields:
  - Font family
  - Font size
  - Line height
  - Paragraph indent
- Kindle device selector

When generating EPUB, popup persists:

- `stk_kindle_device`
- `stk_font_settings`

## Options Page Configuration

Configured in `src/options/options.html` and `src/options/options.ts`:

- Kindle email
- EmailJS public key
- Domain override list (pattern + selector)
- Default typography values

### Domain Overrides

Domain overrides map host patterns to CSS selectors.

Examples from defaults:

- `*.wikipedia.org` -> `#mw-content-text`
- `medium.com` -> `article`
- `*.substack.com` -> `.post-content`
- `news.ycombinator.com` -> `.comment-tree`
- `github.com` -> `article.markdown-body`

Matching behavior in `src/background/domain-list.ts`:

- `*.example.com` matches both `example.com` and subdomains
- exact pattern matches only exact hostname

## Email Delivery Configuration

The send flow in `src/popup/delivery.ts` expects:

- `serviceId`: currently fixed to `default_service`
- `templateId`: currently fixed to `stk_kindle`
- `publicKey`: read from `stk_emailjs_key`
- `kindleEmail`: read from `stk_kindle_email`

Template variables sent to EmailJS:

- `to_email`
- `epub_filename`
- `epub_base64`

## Runtime Message Configuration

Message commands in `src/common/messages.ts`:

- `activate-auto`
- `activate-manual`
- `deactivate`
- `return-html`
- `content-ready`
- `deactivate-ack`

These coordinate popup/background/content workflows.
