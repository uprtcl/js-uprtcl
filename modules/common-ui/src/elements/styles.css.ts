import { css } from 'lit-element';

export const styles = css`
  .button-text {
    font-family: 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
    text-decoration: none;
    text-transform: uppercase;
    font-family: Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    font-stretch: 100%;
    letter-spacing: 1.25px;
    user-select: none;
  }
  .button-filled {
    background-color: var(--background-color, #2196f3);
    color: #ffffff;
  }
  .button-filled svg {
    fill: white;
  }
  .button-filled:hover {
    background-color: var(--background-color-hover, #50b0ff);
  }
  .button-filled-secondary {
    background-color: var(--background-color, #c9d4db);
    color: #ffffff;
  }
  .button-filled-secondary-no-hover {
    background-color: var(--background-color, #c9d4db);
    color: #ffffff;
  }
  .button-filled-secondary-no-hover svg {
    fill: white;
  }
  .button-filled-secondary svg {
    fill: white;
  }
  .button-filled-secondary:hover {
    background-color: #89b7da;
  }
  .button-disabled {
    background-color: #bbd6ec;
    color: #ffffff;
  }
  .button-disabled svg {
    fill: white;
  }
  .button-skinny {
    background-color: transparent;
    color: #2196f3;
  }
  .button-skinny svg {
    fill: #2196f3;
  }
  .button-skinny:hover {
    color: #50b0ff;
    background-color: #eef7ff;
  }
  .cursor {
    cursor: pointer;
  }
  .bg-transition {
    transition: background-color 0.5s ease;
  }
`;
