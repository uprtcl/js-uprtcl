import { html } from 'lit-element';
import { randomColor } from 'randomcolor';

const MT2D = 30;
const D2H = 24;
const H2M = 60;
const M2S = 60;
const S2MS = 1000;

const MT2MS = MT2D * D2H * H2M * M2S * S2MS;
const D2MS = D2H * H2M * M2S * S2MS;
const H2MS = H2M * M2S * S2MS;
const M2MS = H2M * M2S * S2MS;

export const prettyTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const ago = Date.now() - timestamp;
  let value;

  if (ago > 3 * MT2MS) {
    return `on ${date.getMonth()} ${date.getUTCDay} `;
  } else {
    if (ago > 1 * MT2MS) {
      value = Math.floor(ago / MT2MS);
      return `${value} month${value > 1 ? 's' : ''} ago`;
    } else {
      if (ago > 1 * D2MS) {
        value = Math.floor(ago / D2MS);
        return `${value} day${value > 1 ? 's' : ''} ago`;
      } else {
        if (ago > 1 * H2MS) {
          value = Math.floor(ago / H2MS);
          return `${value} hour${value > 1 ? 's' : ''} ago`;
        } else {
          if (ago > 5 * M2MS) {
            value = Math.floor(ago / M2MS);
            return `${value} minute${value > 1 ? 's' : ''} ago`;
          } else {
            return `a few minutes ago`;
          }
        }
      }
    }
  }
};

export const prettyAddress = (address: string) => {
  return html` <span
    style="font-family: Lucida Console, Monaco, monospace; background-color: #d0d8db; padding: 3px 6px; font-size: 14px; border-radius: 3px; margin-right: 6px;"
  >
    ${address.substr(0, 4)}...${address.substr(
      address.length - 3,
      address.length
    )}
  </span>`;
};

export const DEFAULT_COLOR: string = '#d0dae0';

export const eveeColor = (perspectiveId: string): string => {
  return randomColor({ seed: perspectiveId });
};
