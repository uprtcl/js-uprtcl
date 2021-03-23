import { css } from 'lit-element';

export const styles = css`
  :root {
    --primary: #2f80ed;
    --white: #ffffff;
    --black: #000000;
    --black-transparent: rgba(3, 3, 3, 0.25);
    --gray-dark: #333333;
    --gray-light: #828282;
    --border-radius-complete: 100vh;
  }
  .button-text {
    font-family: 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
    text-decoration: none;
    font-family: Inter;
    font-size: 14px;
    font-weight: 500;
    font-stretch: 100%;
    letter-spacing: 1.25px;
    user-select: none;
  }
  .button-filled {
    background-color: var(--primary, #2f80ed);
    color: #ffffff;
  }
  .button-filled svg {
    fill: white;
  }
  .button-filled:hover {
    background-color: var(--background-color-hover, #50b0ff);
  }
  .button-filled-secondary {
    background-color: var(--primary, #2f80ed);
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
  }
  .button-skinny:hover {
    color: #50b0ff;
    background-color: #eef7ff;
  }
  .button-skinny-secondary {
    background-color: transparent;
  }
  .button-skinny-secondary svg {
    fill: #5f5e5e9b;
  }
  .button-skinny-secondary:hover {
    color: #3e474e;
    background-color: #ebebeb;
  }
  .cursor {
    cursor: pointer;
  }
  .bg-transition {
    transition: background-color 0.5s ease;
  }
`;
