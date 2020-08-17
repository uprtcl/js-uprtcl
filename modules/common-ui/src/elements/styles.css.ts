import { css } from 'lit-element';

export const styles = css`
  .button-color {
    color: white;
    cursor: pointer;
    font-family: 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    background-color: #4a99ca;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
  }
  .button-color svg {
    fill: white;
  }
  .button-color:hover {
    background-color: #6590aa;
  }
`;
