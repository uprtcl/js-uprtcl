import '@github/clipboard-copy-element';

import { UprtclButton } from './elements/button';
import { UprtclLoading } from './elements/loading';
import { UprtclList } from './elements/list';
import { UprtclListItem } from './elements/list-item';
import { UprtclCard } from './elements/card';
import { UprtclButtonLoading } from './elements/button-loading';
import { UprtclPopper } from './elements/popper';
import { UprtclOptionsMenu } from './elements/options-menu';
import { UprtclDialog } from './elements/dialog';
import { UprtclHelp } from './elements/help';
import { UprtclFormString } from './elements/form-string';
import { UprtclListItemWithOption } from './elements/list-item-options';
import { UprtclIconButton } from './elements/icon-button';
import { UprtclTextField } from './elements/text-field';
import { UprtclSelect } from './elements/select';
import { UprtclToggle } from './elements/toggle';
import { UprtclIndicator } from './elements/indicator';
import { UprtclCopyToClipboard } from './elements/copy-to-clipboard';
import { UprtclIconAndName } from './elements/icon-and-name';
import { UprtclExpandable } from './elements/expandable';
import { UprtclIconsGallery } from './elements/icons.gallery';

export function registerComponents() {
  customElements.define('uprtcl-button', UprtclButton);
  customElements.define('uprtcl-button-loading', UprtclButtonLoading);
  customElements.define('uprtcl-icon-button', UprtclIconButton);
  customElements.define('uprtcl-loading', UprtclLoading);
  customElements.define('uprtcl-list', UprtclList);
  customElements.define('uprtcl-list-item', UprtclListItem);
  customElements.define('uprtcl-list-item-option', UprtclListItemWithOption);
  customElements.define('uprtcl-card', UprtclCard);
  customElements.define('uprtcl-popper', UprtclPopper);
  customElements.define('uprtcl-options-menu', UprtclOptionsMenu);
  customElements.define('uprtcl-dialog', UprtclDialog);
  customElements.define('uprtcl-help', UprtclHelp);
  customElements.define('uprtcl-textfield', UprtclTextField);
  customElements.define('uprtcl-form-string', UprtclFormString);
  customElements.define('uprtcl-select', UprtclSelect);
  customElements.define('uprtcl-toggle', UprtclToggle);
  customElements.define('uprtcl-indicator', UprtclIndicator);
  customElements.define('uprtcl-copy-to-clipboard', UprtclCopyToClipboard);
  customElements.define('uprtcl-icon-and-name', UprtclIconAndName);
  customElements.define('uprtcl-expandable', UprtclExpandable);
  customElements.define('uprtcl-icons-gallery', UprtclIconsGallery);
}
