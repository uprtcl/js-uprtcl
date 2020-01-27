export const htmlToText = (textWithHtml: string): string => {
  const temp = document.createElement('template');
  temp.innerHTML = textWithHtml;

  if (!temp.content) return 'unknown';
  if (temp.content.textContent !== '') {
    return temp.content.textContent != null ? temp.content.textContent : 'unknown';
  } else {
    if (!temp.content.firstElementChild) return 'unknown';
    return (temp.content.firstElementChild as HTMLElement).innerText;
  }
};
