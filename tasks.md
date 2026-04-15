# Send To Kindle (Chrome Extension)

The extension grabs content from a webpage, converts it epub and send to kindle via email, or download directly.

## Main features

1. Allow user to use automatic mode, which analysis the page and select the DOM that has the main content.
2. Allow user to use manual mode, which let user select an area (DOM) and use this as content to be sent to kindle.
3. Allow user to edit the generated epub metadata, e.g. title, author, etc.
4. Keep images
5. Generate TOC if applicable.
6. Let user select Kindle (ebook) model to optimize.
7. Use a pre-defined domain list, which contains which DOM should be used. If the URL of the page matches, use the pre-defined list in auto mode.
8. Let user select font, font size, indentation and line spacing.

## What copilot should do

1. please let me know what 3rd party libraries i should include (e.g. how to convert HTML to epub, etc)
2. please create plans to implement the features, implement major feature first, then smaller improvements.
   1. The plan should include tests.
3. please create a plan to pack the extension.
4. please update README.md, to include how to install the extension in chrome, and how to test.
