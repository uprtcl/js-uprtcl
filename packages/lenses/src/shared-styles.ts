import { css } from 'lit-element';

export const sharedStyles = css`
  .row {
    display: flex;
    flex-direction: row;
  }

  .fill-content {
    height: 100%;
    width: 100%;
    flex: 1;
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
