# Compose local asset controls

Use `rc-local-asset-field` when an application needs to validate or prepare a
file in the browser. The element doesn't upload or persist the file.

## Register the elements

```ts
import {defineReclaimElements} from '@reclaimprotocol/design/elements';
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css';

defineReclaimElements();
```

## Add a local image field

Use a native file input so the field remains usable before JavaScript loads.

```html
<rc-local-asset-field
  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
  max-size="5000000"
  min-image-width="512"
  min-image-height="512"
>
  <label class="rc-upload">
    <strong>Partner logo</strong>
    <span>Choose a PNG or JPEG image up to 5 MB.</span>
    <input type="file" />
  </label>
</rc-local-asset-field>
```

The element validates the extension or MIME type, file size, and configured
image dimensions. It displays `preparing`, `ready`, `warning`, and `error`
states through the standard upload-result pattern.

## Prepare an asset asynchronously

Assign complex behavior as a JavaScript property. Don't serialize functions in
HTML attributes.

```ts
const field = document.querySelector('rc-local-asset-field');

field.prepare = async (file, signal) => {
  const poster = await captureVideoPoster(file, {signal});
  return {
    source: poster,
    description: 'Poster frame ready',
  };
};

field.addEventListener('reclaim:assetchange', event => {
  updateAsset(event.detail);
});
```

The element aborts preparation when the selection changes or the field clears.
It also revokes every object URL that it creates.

## Open the image editor

Compose the editor with the local asset field. The application decides when an
asset should enter editing and owns the final value.

```html
<rc-image-editor
  id="logo-editor"
  aspect-ratio="1"
  output-width="1600"
  fit="contain"
></rc-image-editor>
```

```ts
const editor = document.querySelector('#logo-editor');

field.addEventListener('reclaim:assetchange', event => {
  editor.source = event.detail.url;
  editor.open();
});

editor.addEventListener('reclaim:imageapply', event => {
  updateEditedImage(event.detail.dataUrl);
});
```

The editor uses a native modal dialog and canvas. A user can drag the preview,
use the arrow keys to reposition it, change fit and framing controls, and export
a local PNG data URL.
