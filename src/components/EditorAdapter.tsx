import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicSetup } from 'codemirror';

const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: '#0f1115',
      color: '#f5f5f5'
    },
    '.cm-scroller': {
      overflow: 'auto'
    },
    '.cm-content': {
      padding: '16px',
      fontSize: 'var(--editor-font-size, 14px)',
      lineHeight: '1.5',
      fontFamily: 'inherit'
    },
    '.cm-gutters': {
      backgroundColor: '#0f1115',
      color: '#6b7280',
      border: 'none'
    }
  },
  { dark: true }
);

const findWikiLinkAt = (text: string, offset: number) => {
  const start = text.lastIndexOf('[[', offset);
  if (start === -1) {
    return null;
  }
  const end = text.indexOf(']]', offset);
  if (end === -1) {
    return null;
  }
  if (offset < start || offset > end) {
    return null;
  }
  const content = text.slice(start + 2, end);
  if (!content) {
    return null;
  }
  const [target] = content.split('|');
  const trimmed = target?.trim();
  return trimmed ? trimmed : null;
};

type EditorAdapterProps = {
  value: string;
  onChange: (next: string) => void;
  onCtrlClickLink?: (linkText: string) => void;
};

const EditorAdapter = ({ value, onChange, onCtrlClickLink }: EditorAdapterProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const ignoreNextChange = useRef(false);
  const onChangeRef = useRef(onChange);
  const onCtrlClickRef = useRef(onCtrlClickLink);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCtrlClickRef.current = onCtrlClickLink;
  }, [onCtrlClickLink]);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const handleUpdate = (update: ViewUpdate) => {
      if (!update.docChanged) {
        return;
      }
      if (ignoreNextChange.current) {
        ignoreNextChange.current = false;
        return;
      }
      onChangeRef.current(update.state.doc.toString());
    };

    const handleMouseDown = (event: MouseEvent, view: EditorView) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return false;
      }
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos == null) {
        return false;
      }
      const line = view.state.doc.lineAt(pos);
      const target = findWikiLinkAt(line.text, pos - line.from);
      if (!target) {
        return false;
      }
      event.preventDefault();
      onCtrlClickRef.current?.(target);
      return true;
    };

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        EditorView.lineWrapping,
        editorTheme,
        EditorView.updateListener.of(handleUpdate),
        EditorView.domEventHandlers({
          mousedown: handleMouseDown
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: hostRef.current
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (currentValue === value) {
      return;
    }
    ignoreNextChange.current = true;
    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value
      }
    });
  }, [value]);

  return <div className="editor-pane" ref={hostRef} />;
};

export default EditorAdapter;
