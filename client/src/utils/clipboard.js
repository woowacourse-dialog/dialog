export async function copyRichText(html, plain) {
  if (navigator.clipboard && window.ClipboardItem) {
    const data = [
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ];
    await navigator.clipboard.write(data);
  } else {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    const range = document.createRange();
    range.selectNodeContents(temp);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(temp);
  }
}
