import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";

// Types
interface Settings {
  headingColor: string;
  boldColor: string;
  textColor: string;
  codeBg: string;
  codeMarginTop: number;
  codeMarginBottom: number;
  fontSize: number;
  lineHeight: number;
}

// Preset Themes
const PRESETS = {
  blue: { primary: "#1e88e5", name: "经典蓝" },
  red: { primary: "#d32f2f", name: "热烈红" },
  green: { primary: "#388e3c", name: "清新绿" },
  purple: { primary: "#7b1fa2", name: "优雅紫" },
  orange: { primary: "#f57c00", name: "活力橙" },
  black: { primary: "#333333", name: "极简黑" },
};

const DEFAULT_MARKDOWN = `# 微信公众号排版工具

这是一个 **基于代码实现** 的纯前端排版工具。

## 功能特点

1. **实时预览**：左侧输入，右侧即时显示。
2. **多主题支持**：内置多种配色方案，一键切换。
3. **完美兼容**：生成的 HTML 可直接复制到微信后台。

## 代码样式

\`\`\`javascript
const output = "Hello Wechat";
console.log(output);
\`\`\`

> 排版原本是一件 **枯燥** 的事情，但有了工具，一切变得 **简单**。

### 有序列表
1. 第一点
2. 第二点

### 无序列表
- 苹果
- 香蕉

---

祝你的文章阅读量 **10万+**！
`;

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [htmlOutput, setHtmlOutput] = useState("");
  const [copyStatus, setCopyStatus] = useState("复制 HTML");
  
  // Settings State
  const [settings, setSettings] = useState<Settings>({
    headingColor: "#1e88e5",
    boldColor: "#1e88e5",
    textColor: "#3f3f3f",
    codeBg: "#f6f8fa",
    codeMarginTop: 15,
    codeMarginBottom: 15,
    fontSize: 16,
    lineHeight: 1.8,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showObsidian, setShowObsidian] = useState(false);

  // Refs for sync scrolling
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Apply a preset theme
  const applyPreset = (primary: string) => {
    setSettings(prev => ({
      ...prev,
      headingColor: primary,
      boldColor: primary
    }));
  };

  // -------------------------------------------------------------------------
  // Markdown Renderer Configuration
  // -------------------------------------------------------------------------
  useEffect(() => {
    const renderer = new marked.Renderer();

    // 1. Heading
    renderer.heading = (text, level) => {
       const commonStyle = `font-weight: bold; line-height: 1.4; color: ${settings.headingColor};`;
       if (level === 1) {
           return `<h1 style="${commonStyle} margin: 20px 0 30px; font-size: ${settings.fontSize * 1.4}px; text-align: center;">${text}</h1>`;
       } else if (level === 2) {
           return `<section style="margin-top: 40px; margin-bottom: 20px; text-align: center;"><span style="font-size: ${settings.fontSize * 1.125}px; font-weight: bold; border-bottom: 2px solid ${settings.headingColor}; color: ${settings.headingColor}; padding-bottom: 5px; display: inline-block;">${text}</span></section>`;
       } else {
           return `<h3 style="${commonStyle} margin: 25px 0 10px; font-size: ${settings.fontSize}px; border-left: 4px solid ${settings.headingColor}; padding-left: 10px;">${text}</h3>`;
       }
    };

    // 2. Paragraph
    renderer.paragraph = (text) => {
        return `<p style="margin: 0 0 20px; font-size: ${settings.fontSize}px; line-height: ${settings.lineHeight}; text-align: justify; color: ${settings.textColor}; letter-spacing: 0.5px;">${text}</p>`;
    };

    // 3. Blockquote
    renderer.blockquote = (quote) => {
        return `<blockquote style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid ${settings.headingColor}; border-radius: 4px; color: #555; font-size: ${settings.fontSize * 0.95}px; line-height: 1.6;">${quote}</blockquote>`;
    };

    // 4. Code Block
    renderer.code = (code, language) => {
        return `<pre style="margin-top: ${settings.codeMarginTop}px; margin-bottom: ${settings.codeMarginBottom}px; padding: 15px; background: ${settings.codeBg}; border-radius: 6px; font-size: 14px; line-height: 1.5; color: #333; overflow-x: auto; font-family: Consolas, Monaco, 'Andale Mono', monospace; border: 1px solid #e1e4e8;"><code>${code}</code></pre>`;
    };

    // 5. Inline Code
    renderer.codespan = (text) => {
        return `<code style="background: #fff5f5; color: #ff502c; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; margin: 0 2px;">${text}</code>`;
    };

    // 6. Strong
    renderer.strong = (text) => {
        return `<strong style="color: ${settings.boldColor}; font-weight: bold;">${text}</strong>`;
    };

    // 7. Lists
    renderer.list = (body, ordered, start) => {
        const type = ordered ? "ol" : "ul";
        return `<${type} style="margin: 10px 0 20px; padding-left: 25px; font-size: ${settings.fontSize}px; color: ${settings.textColor}; line-height: 1.75;">${body}</${type}>`;
    };
    renderer.listitem = (text) => {
        return `<li style="margin-bottom: 5px;">${text}</li>`;
    };

    // 8. Images
    renderer.image = (href, title, text) => {
        return `<img src="${href}" alt="${text}" style="display: block; max-width: 100%; height: auto; margin: 20px auto; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />`;
    };

    // 9. HR
    renderer.hr = () => {
        return `<hr style="border: 0; border-top: 1px dashed ${settings.headingColor}; margin: 30px 0; opacity: 0.6;" />`;
    };
    
    // 10. Links
    renderer.link = (href, title, text) => {
        return `<a href="${href}" style="color: ${settings.headingColor}; text-decoration: none; border-bottom: 1px solid ${settings.headingColor}; word-break: break-all;">${text}</a>`;
    };

    try {
        const rawHtml = marked.parse(markdown, { renderer, breaks: true, gfm: true });
        const wrappedHtml = `<section id="wechat-typeset" style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 16px;">
${rawHtml}
</section>`;
        setHtmlOutput(wrappedHtml);
    } catch (e) {
        console.error("Markdown parse error:", e);
    }
  }, [markdown, settings]);


  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  // Copy HTML
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlOutput);
      setCopyStatus("已复制!");
      setTimeout(() => setCopyStatus("复制 HTML"), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Keyboard Shortcuts (Ctrl+B)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      
      const selected = val.substring(start, end);
      const replacement = `**${selected}**`;
      
      const newVal = val.substring(0, start) + replacement + val.substring(end);
      setMarkdown(newVal);
      
      // Restore cursor selection (wrapping the text)
      // Use setTimeout to ensure React render cycle completes if needed, though usually works directly
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    }
  };

  // Sync Scroll
  const handleScroll = (source: 'editor' | 'preview') => {
    if (isScrollingRef.current) return;

    isScrollingRef.current = true;
    const editor = editorRef.current;
    const preview = previewRef.current;
    
    // We target the inner scrolling div of the preview
    // Structure: previewRef (container) -> div (scrollable)
    // Actually, in our JSX, previewRef IS the scrollable div.
    
    if (editor && preview) {
       if (source === 'editor') {
          const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
          preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
       } else {
          const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
          editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
       }
    }

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50); // Small debounce to prevent jitter loop
  };

  // Obsidian CSS Generator
  const getObsidianCSS = () => {
    return `/* 将以下代码保存为 obsidian-wechat.css 并放入 .obsidian/snippets 文件夹中，然后在外观设置中启用 */

.markdown-preview-view {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: ${settings.fontSize}px !important;
  line-height: ${settings.lineHeight} !important;
  color: ${settings.textColor} !important;
}

.markdown-preview-view h1 {
  text-align: center !important;
  font-size: ${settings.fontSize * 1.4}px !important;
  color: ${settings.headingColor} !important;
  margin: 20px 0 30px !important;
}

.markdown-preview-view h2 {
  text-align: center !important;
  border-bottom: 2px solid ${settings.headingColor} !important;
  color: ${settings.headingColor} !important;
  font-size: ${settings.fontSize * 1.125}px !important;
  margin-top: 40px !important;
  margin-bottom: 20px !important;
  display: inline-block !important;
}

.markdown-preview-view h3 {
  border-left: 4px solid ${settings.headingColor} !important;
  padding-left: 10px !important;
  color: ${settings.headingColor} !important;
  font-size: ${settings.fontSize}px !important;
  margin: 25px 0 10px !important;
}

.markdown-preview-view p {
  text-align: justify !important;
  margin-bottom: 20px !important;
}

.markdown-preview-view strong {
  color: ${settings.boldColor} !important;
}

.markdown-preview-view blockquote {
  border-left-color: ${settings.headingColor} !important;
  background-color: #f9f9f9 !important;
}

.markdown-preview-view pre {
  background-color: ${settings.codeBg} !important;
  margin-top: ${settings.codeMarginTop}px !important;
  margin-bottom: ${settings.codeMarginBottom}px !important;
  padding: 15px !important;
  border-radius: 6px !important;
}
`;
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <header
        style={{
          padding: "0 20px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          flexShrink: 0,
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🎨</span>
          <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "600" }}>
            公众号代码版排版
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Preset Colors */}
          <div style={{ display: "flex", gap: "6px", alignItems: 'center', marginRight: '10px' }}>
            {Object.entries(PRESETS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => applyPreset(val.primary)}
                title={val.name}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: val.primary,
                  border: settings.headingColor === val.primary ? `2px solid #333` : "2px solid white",
                  boxShadow: "0 0 0 1px #ddd",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              background: showSettings ? "#f0f0f0" : "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            ⚙️ 设置
          </button>

           <button
            onClick={() => setShowObsidian(true)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              background: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Obsidian 方案
          </button>

          <button
            onClick={copyToClipboard}
            style={{
              padding: "6px 16px",
              border: "none",
              background: settings.headingColor,
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              transition: "background 0.2s"
            }}
          >
            {copyStatus}
          </button>
        </div>
      </header>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <div style={{
          position: "absolute",
          top: "60px",
          right: "20px",
          width: "300px",
          backgroundColor: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          borderRadius: "0 0 8px 8px",
          padding: "20px",
          zIndex: 20,
          border: "1px solid #eee",
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
           <div style={{fontSize: '14px', fontWeight: 'bold', color: '#333'}}>颜色设置</div>
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '13px'}}>标题/强调色</span>
              <input 
                type="color" 
                value={settings.headingColor} 
                onChange={(e) => setSettings({...settings, headingColor: e.target.value})}
              />
           </div>
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '13px'}}>正文高亮(Bold)</span>
              <input 
                type="color" 
                value={settings.boldColor} 
                onChange={(e) => setSettings({...settings, boldColor: e.target.value})}
              />
           </div>

           <hr style={{border: 'none', borderTop: '1px solid #eee', width: '100%'}}/>

           <div style={{fontSize: '14px', fontWeight: 'bold', color: '#333'}}>间距与大小</div>
           
           <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontSize: '13px'}}>字号 ({settings.fontSize}px)</span>
              </div>
              <input 
                type="range" min="12" max="20" step="1"
                value={settings.fontSize}
                onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})}
              />
           </div>

           <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontSize: '13px'}}>代码块上边距 ({settings.codeMarginTop}px)</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1"
                value={settings.codeMarginTop}
                onChange={(e) => setSettings({...settings, codeMarginTop: Number(e.target.value)})}
              />
           </div>

           <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontSize: '13px'}}>代码块下边距 ({settings.codeMarginBottom}px)</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1"
                value={settings.codeMarginBottom}
                onChange={(e) => setSettings({...settings, codeMarginBottom: Number(e.target.value)})}
              />
           </div>
        </div>
      )}

      {/* Obsidian Modal */}
      {showObsidian && (
         <div style={{
             position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
             background: 'rgba(0,0,0,0.5)', zIndex: 100,
             display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
             <div style={{
                 background: 'white', width: '500px', padding: '20px', borderRadius: '8px',
                 boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                 display: 'flex', flexDirection: 'column', gap: '15px'
             }}>
                 <h3 style={{margin: 0}}>Obsidian 集成方案</h3>
                 <p style={{fontSize: '13px', color: '#666', margin: 0}}>
                    复制下方的 CSS 代码，保存为 <code>wechat-style.css</code>，放入你的 Obsidian 仓库的 <code>.obsidian/snippets</code> 文件夹中，然后在【设置 -&gt; 外观 -&gt; CSS 代码片段】中启用即可。
                 </p>
                 <textarea 
                    readOnly 
                    value={getObsidianCSS()}
                    style={{
                        width: '100%', height: '200px', 
                        fontSize: '12px', fontFamily: 'monospace',
                        padding: '10px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px'
                    }}
                 />
                 <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                     <button onClick={() => setShowObsidian(false)} style={{padding: '8px 16px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px'}}>关闭</button>
                 </div>
             </div>
         </div>
      )}

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e0e0e0",
            backgroundColor: "#fff",
            minWidth: "300px"
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #eee",
              fontSize: "12px",
              color: "#666",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>Markdown 输入</span>
            <span style={{fontSize: '10px', color: '#999'}}>快捷键: Ctrl+B 加粗</span>
          </div>
          <textarea
            ref={editorRef}
            onScroll={() => handleScroll('editor')}
            onKeyDown={handleKeyDown}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="在此输入 Markdown 文章内容..."
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              padding: "20px",
              fontSize: "15px",
              lineHeight: "1.6",
              outline: "none",
              resize: "none",
              fontFamily: "Monaco, 'Courier New', monospace",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Right: Preview */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f9f9f9",
            minWidth: "300px"
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #eee",
              fontSize: "12px",
              color: "#666",
              fontWeight: "600",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textTransform: "uppercase",
            }}
          >
            <span>排版预览 (实时)</span>
          </div>
          
          <div
            ref={previewRef}
            onScroll={() => handleScroll('preview')}
            style={{
              flex: 1,
              padding: "40px",
              overflowY: "auto",
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {/* Mobile-like container preview */}
            <div
              style={{
                width: "100%",
                maxWidth: "600px",
                minHeight: "800px",
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                padding: "20px",
                borderRadius: "8px",
                position: "relative",
                marginBottom: "40px" // Add bottom margin for scroll ease
              }}
            >
              {htmlOutput ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: htmlOutput }} 
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                   请输入内容...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
