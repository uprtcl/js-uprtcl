export const htmlToText = (textWithHtml: string): string => {
  const temp = document.createElement('template');
  temp.innerHTML = textWithHtml;

  if (!temp.content) return '';
  if (temp.content.textContent !== '') {
    return temp.content.textContent != null ? temp.content.textContent : '';
  } else {
    if (!temp.content.firstElementChild) return '';
    return (temp.content.firstElementChild as HTMLElement).innerText;
  }
};
