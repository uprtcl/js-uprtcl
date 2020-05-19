import { html } from 'lit-element';

export const prettyAddress = (address: string) => {
  return html` <span
    style="font-family: Lucida Console, Monaco, monospace; background-color: #d0d8db; padding: 3px 6px; font-size: 14px; border-radius: 3px; margin-right: 6px;"
  >
    ${address.substr(0, 4)}...${address.substr(address.length - 3, address.length)}
  </span>`;
};
