import { html } from "lit-element";

const MT2D = 30;
const D2H = 24;
const H2M = 60;
const M2S = 60;
const S2MS = 1000;

const MT2MS = MT2D * D2H * H2M* M2S * S2MS;
const D2MS = D2H * H2M * M2S * S2MS;
const H2MS = H2M * M2S * S2MS;
const M2MS = H2M * M2S * S2MS;

export const prettyTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const ago = Date.now() - timestamp;

  if (ago > 3 * MT2MS) {
    return `on ${date.getMonth()} ${date.getUTCDay} `;
  } else {
    if (ago > 1 * MT2MS) {
      return `${Math.floor(ago/M2MS)} months ago`;
    } else {
      if (ago > 1 * D2MS) {
        return `${Math.floor(ago/D2MS)} days ago`;
      } else {
        if (ago > 1 * H2MS) {
          return `${Math.floor(ago/H2MS)} hours ago`;
        } else {
          if (ago > 5 * M2MS) {
            return `${Math.floor(ago/H2MS)} minutes ago`;
          } else {
            return `a few minutes ago`;
          } 
        }  
      }
    }
  }
}

export const prettyAddress = (address: string) => {
  return html`
    <span style="font-family: Lucida Console, Monaco, monospace; background-color: #d0d8db; padding: 3px 6px; font-size: 14px; border-radius: 3px; margin-right: 6px;">
      ${address.substr(0,4)}...${address.substr(address.length - 3, address.length)}
    </span>`;
}