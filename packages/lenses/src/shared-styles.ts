import { css } from 'lit-element';

export const sharedStyles = css`
  .row {
    display: flex;
    flex-direction: row;
  }

  .column {
    display: flex;
    flex-direction: column;
  }

  .center-content {
    align-items: center;
    justify-content: center;
  }

  :root {
    --huge-padding: 24px;
    --big-padding: 18px;
    --medium-padding: 12px;
    --small-padding: 4px;
  }
`;
