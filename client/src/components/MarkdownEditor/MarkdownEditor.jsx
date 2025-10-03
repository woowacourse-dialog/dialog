import React, { useCallback, useMemo, useRef, useState } from 'react';
import MarkdownRender from '../Markdown/MarkdownRender';
import './MarkdownEditor.css';
import iconBold from '../../assets/markdown/bold.svg';
import iconItalic from '../../assets/markdown/italic.svg';
import iconLink from '../../assets/markdown/link.svg';
import iconInlineCode from '../../assets/markdown/code.svg';
import iconCodeBlock from '../../assets/markdown/code-block.svg';
import iconOrdered from '../../assets/markdown/ordered-list.svg';
import iconUnordered from '../../assets/markdown/unordered-list.svg';
import iconQuote from '../../assets/markdown/indent.svg';

const MarkdownEditor = ({ value, onChange, placeholder }) => {
  const [mode, setMode] = useState('write'); // 'write' | 'preview' | 'split'
  const textareaRef = useRef(null);

  const defaultPlaceholder = `마크다운 형식으로 내용을 작성해주세요.`;

  const setSelectionAndFocus = useCallback((start, end) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  }, []);

  const commitValueChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // dispatch an input event so React onChange updates value, preserving undo stack
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    onChange(textarea.value);
  }, [onChange]);

  const focusEditorIfWritable = useCallback(() => {
    if (mode === 'write' || mode === 'split') {
      const t = textareaRef.current;
      if (t) requestAnimationFrame(() => t.focus());
    }
  }, [mode]);

  const replaceSelection = useCallback((transform) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    const result = transform({ before, selected, after, selectionStart, selectionEnd });
    if (!result) return;
    const { replacement, replaceStart = selectionStart, replaceEnd = selectionEnd, newSelectionStart, newSelectionEnd } = result;
    textarea.setRangeText(replacement, replaceStart, replaceEnd, 'end');
    commitValueChange();
    const selStart = newSelectionStart ?? replaceStart + replacement.length;
    const selEnd = newSelectionEnd ?? selStart;
    setSelectionAndFocus(selStart, selEnd);
  }, [commitValueChange, setSelectionAndFocus, value]);

  const toggleWrap = useCallback((wrapper) => {
    replaceSelection(({ before, selected, after, selectionStart, selectionEnd }) => {
      const textarea = textareaRef.current;
      if (!textarea) return null;
      const left = before.slice(-wrapper.length);
      const right = after.slice(0, wrapper.length);

      // Case 1: Selection exactly wrapped -> unwrap
      const isExactlyWrapped = selected.startsWith(wrapper) && selected.endsWith(wrapper);
      if (isExactlyWrapped) {
        const unwrapped = selected.slice(wrapper.length, selected.length - wrapper.length);
        return {
          replacement: unwrapped,
          replaceStart: selectionStart,
          replaceEnd: selectionEnd,
          newSelectionStart: selectionStart,
          newSelectionEnd: selectionStart + unwrapped.length
        };
      }

      // Case 2: No selection and caret is between wrappers -> remove wrappers
      if (selected.length === 0 && left === wrapper && right === wrapper) {
        return {
          replacement: '',
          replaceStart: selectionStart - wrapper.length,
          replaceEnd: selectionEnd + wrapper.length,
          newSelectionStart: selectionStart - wrapper.length,
          newSelectionEnd: selectionStart - wrapper.length
        };
      }

      // Case 3a: Selection is exactly inner content of a wrapped span -> unwrap that span
      if (selected.length > 0 && left === wrapper && right === wrapper && !selected.includes(wrapper)) {
        return {
          replacement: selected,
          replaceStart: selectionStart - wrapper.length,
          replaceEnd: selectionEnd + wrapper.length,
          newSelectionStart: selectionStart - wrapper.length,
          newSelectionEnd: selectionStart - wrapper.length + selected.length
        };
      }

      // Case 3b: No selection and caret is inside a wrapped span -> unwrap that span
      if (selected.length === 0) {
        const text = value;
        const pos = selectionStart;
        const startIdx = text.lastIndexOf(wrapper, pos);
        const endIdx = text.indexOf(wrapper, pos);
        if (startIdx !== -1 && endIdx !== -1 && startIdx < pos && endIdx > pos) {
          return {
            replacement: text.slice(startIdx + wrapper.length, endIdx),
            replaceStart: startIdx,
            replaceEnd: endIdx + wrapper.length,
            newSelectionStart: startIdx,
            newSelectionEnd: startIdx
          };
        }
      }

      // Case 4: No selection -> wrap current word; otherwise wrap selection
      let selStart = selectionStart;
      let selEnd = selectionEnd;
      if (selected.length === 0) {
        const text = value;
        const isWordChar = (ch) => /[^\s]/.test(ch);
        let i = selStart - 1;
        while (i >= 0 && isWordChar(text[i])) i--;
        let j = selEnd;
        while (j < text.length && isWordChar(text[j])) j++;
        selStart = Math.max(0, i + 1);
        selEnd = j;
      }
      const content = value.slice(selStart, selEnd);
      const replacement = `${wrapper}${content}${wrapper}`;
      return {
        replacement,
        replaceStart: selStart,
        replaceEnd: selEnd,
        newSelectionStart: selStart + wrapper.length,
        newSelectionEnd: selStart + wrapper.length + content.length
      };
    });
  }, [replaceSelection]);

  const insertAtLineStart = useCallback((prefix) => {
    replaceSelection(({ selectionStart, selectionEnd }) => {
      const text = value;
      const prevNewline = text.lastIndexOf('\n', selectionStart - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const lineEndTemp = text.indexOf('\n', selectionEnd);
      const lineEnd = lineEndTemp === -1 ? text.length : lineEndTemp;
      const currentLine = text.slice(lineStart, lineEnd);
      const hasPrefix = currentLine.startsWith(prefix);
      const newLine = hasPrefix
        ? currentLine.replace(new RegExp(`^${prefix}`), '')
        : `${prefix}${currentLine}`;
      const delta = newLine.length - currentLine.length;
      const caretPos = selectionEnd + delta;
      return {
        replacement: newLine,
        replaceStart: lineStart,
        replaceEnd: lineEnd,
        newSelectionStart: caretPos,
        newSelectionEnd: caretPos
      };
    });
  }, [replaceSelection, value]);

  const insertLink = useCallback(() => {
    replaceSelection(({ selected, selectionStart, selectionEnd }) => {
      const urlPlaceholder = 'https://';
      const label = selected || '링크 텍스트';
      const linkSyntax = `[${label}](${urlPlaceholder})`;
      return {
        replacement: linkSyntax,
        replaceStart: selectionStart,
        replaceEnd: selectionEnd,
        newSelectionStart: selectionStart + label.length + 3,
        newSelectionEnd: selectionStart + label.length + 3 + urlPlaceholder.length
      };
    });
  }, [replaceSelection]);

  const insertCodeBlock = useCallback(() => {
    replaceSelection(({ selected, selectionStart, selectionEnd }) => {
      const text = value;
      const code = selected || 'code';
      const beforeChar = selectionStart > 0 ? text[selectionStart - 1] : '';
      const afterChar = selectionEnd < text.length ? text[selectionEnd] : '';
      const needLeading = beforeChar && beforeChar !== '\n' ? '\n' : '';
      // ensure exactly one trailing newline after block
      const needTrailing = afterChar && afterChar !== '\n' ? '\n' : '';
      const block = `${needLeading}\n\`\`\`javascript\n${code}\n\`\`\`${needTrailing}\n`;
      const cursor = selectionStart + needLeading.length + 5; // position inside ```js line
      return {
        replacement: block,
        replaceStart: selectionStart,
        replaceEnd: selectionEnd,
        newSelectionStart: cursor,
        newSelectionEnd: cursor
      };
    });
  }, [replaceSelection, value]);

  const applyHeading = useCallback((level) => {
    const hashes = '#'.repeat(level) + ' ';
    insertAtLineStart(hashes);
  }, [insertAtLineStart]);

  const applyUnorderedList = useCallback(() => insertAtLineStart('- '), [insertAtLineStart]);
  const applyOrderedList = useCallback(() => insertAtLineStart('1. '), [insertAtLineStart]);
  const applyBlockquote = useCallback(() => insertAtLineStart('> '), [insertAtLineStart]);

  const handleKeyDown = useCallback((e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const meta = isMac ? e.metaKey : e.ctrlKey;
    if (meta && !e.shiftKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleWrap('**');
        return;
      }
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        toggleWrap('*');
        return;
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertLink();
        return;
      }
    }

    // Smart list handling
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      const text = value;
      const prevNewline = text.lastIndexOf('\n', pos - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const lineEnd = text.indexOf('\n', pos);
      const currentLine = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);

      const unorderedMatch = currentLine.match(/^\s*([*-])\s+/);
      const orderedMatch = currentLine.match(/^\s*(\d+)\.\s+/);

      if (unorderedMatch || orderedMatch) {
        e.preventDefault();
        const indentMatch = currentLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        const afterMarker = currentLine.replace(/^\s*([*-]|\d+\.)\s+/, '');

        // If line is empty after marker, exit list
        if (afterMarker.length === 0) {
          const textarea = textareaRef.current;
          const replaceStart = lineStart;
          const replaceEnd = (lineEnd === -1 ? text.length : lineEnd) + 1; // remove line + newline
          const replacement = '';
          textarea.setRangeText(replacement, replaceStart, replaceEnd, 'end');
          commitValueChange();
          setSelectionAndFocus(replaceStart, replaceStart);
          return;
        }

        // Continue list
        let nextMarker = '';
        if (unorderedMatch) {
          nextMarker = `${indent}- `;
        } else if (orderedMatch) {
          const nextNumber = parseInt(orderedMatch[1], 10) + 1;
          nextMarker = `${indent}${nextNumber}. `;
        }
        const textarea = textareaRef.current;
        const insert = `\n${nextMarker}`;
        textarea.setRangeText(insert, pos, pos, 'end');
        commitValueChange();
        const newPos = pos + insert.length;
        setSelectionAndFocus(newPos, newPos);
        return;
      }
    }

    // Backspace: remove list marker if at start of text after marker
    if (e.key === 'Backspace') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      if (pos === 0) return;
      const text = value;
      const prevNewline = text.lastIndexOf('\n', pos - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const beforeCaret = text.slice(lineStart, pos);
      const markerMatch = beforeCaret.match(/^\s*([*-]|\d+\.)\s$/);
      if (markerMatch) {
        e.preventDefault();
        const markerLen = markerMatch[0].length;
        const start = pos - markerLen;
        const textarea = textareaRef.current;
        textarea.setRangeText('', start, pos, 'end');
        commitValueChange();
        setSelectionAndFocus(start, start);
        return;
      }
    }

    // Tab / Shift+Tab to indent/outdent list items
    if (e.key === 'Tab') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      const text = value;
      const prevNewline = text.lastIndexOf('\n', pos - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const lineEnd = text.indexOf('\n', pos);
      const currentLine = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
      const listMatch = currentLine.match(/^(\s*)([*-]|\d+\.)\s+/);
      if (listMatch) {
        e.preventDefault();
        let indent = listMatch[1];
        if (!e.shiftKey) {
          indent += '  ';
        } else {
          indent = indent.replace(/ {1,2}$/, '');
        }
        const rest = currentLine.slice(listMatch[0].length);
        const marker = listMatch[2];
        const newLine = `${indent}${marker} ${rest}`;
        const textarea = textareaRef.current;
        textarea.setRangeText(newLine, lineStart, (lineEnd === -1 ? text.length : lineEnd), 'end');
        commitValueChange();
        const delta = newLine.length - currentLine.length;
        setSelectionAndFocus(pos + delta, pos + delta);
      }
    }
  }, [commitValueChange, insertLink, setSelectionAndFocus, toggleWrap, value]);

  const toolbar = useMemo(() => ([
    { icon: iconBold, alt: 'bold', title: '굵게 (Ctrl/Cmd+B)', onClick: () => toggleWrap('**') },
    { icon: iconItalic, alt: 'italic', title: '기울임 (Ctrl/Cmd+I)', onClick: () => toggleWrap('*') },
    { icon: iconInlineCode, alt: 'inline code', title: '인라인 코드', onClick: () => toggleWrap('`') },
    { icon: iconCodeBlock, alt: 'code block', title: '코드 블록', onClick: () => insertCodeBlock() },
    { icon: iconUnordered, alt: 'unordered list', title: '불릿 리스트', onClick: () => applyUnorderedList() },
    { icon: iconOrdered, alt: 'ordered list', title: '번호 리스트', onClick: () => applyOrderedList() },
    { icon: iconQuote, alt: 'quote', title: '인용문', onClick: () => applyBlockquote() },
    { icon: iconLink, alt: 'link', title: '링크 (Ctrl/Cmd+K)', onClick: () => insertLink() },
  ]), [applyBlockquote, applyOrderedList, applyUnorderedList, insertCodeBlock, insertLink, toggleWrap]);

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <button
            type="button"
            className={`editor-tab ${mode === 'write' ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setMode('write'); focusEditorIfWritable(); }}
          >
            작성
          </button>
          <button
            type="button"
            className={`editor-tab ${mode === 'preview' ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode('preview')}
          >
            미리보기
          </button>
          <button
            type="button"
            className={`editor-tab ${mode === 'split' ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setMode('split'); focusEditorIfWritable(); }}
            title="분할 보기"
          >
            분할
          </button>
        </div>
        <div className="editor-toolbar">
          {toolbar.map((btn, idx) => (
            <button key={idx} type="button" className="toolbar-btn" title={btn.title} onMouseDown={(e) => e.preventDefault()} onClick={() => { btn.onClick(); focusEditorIfWritable(); }}>
              <img src={btn.icon} alt={btn.alt} className="toolbar-icon" />
            </button>
          ))}
        </div>
      </div>

      <div className={`editor-content ${mode === 'split' ? 'split' : ''}`}>
        {(mode === 'write' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            value={value}
            onKeyDown={handleKeyDown}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || defaultPlaceholder}
            className="markdown-input"
          />
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div className="markdown-preview">
            <MarkdownRender content={value || '내용을 입력해주세요.'} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
