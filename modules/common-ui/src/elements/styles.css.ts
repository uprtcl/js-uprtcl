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
  }
  .button-filled {
    background-color: #2196f3;
    color: #ffffff;
  }
  .button-filled svg {
    fill: white;
  }
  .button-filled:hover {
    background-color: #50b0ff;
  }
  .button-outlined {
    background-color: transparent;
    color: #2196f3;
  }
  .button-outlined svg {
    fill: #2196f3;
  }
  .button-outlined:hover {
    color: #50b0ff;
    background-color: #eef7ff;
  }
`;
