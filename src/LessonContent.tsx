import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/** Authored course text only. Raw HTML is disabled; Markdown sanitizes link URLs. */
export function LessonContent({ text, inline = false }: { text: string; inline?: boolean }) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className="lesson-content">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children, node: _node, ...props }) => inline ? <span {...props}>{children}</span> : <p {...props}>{children}</p>,
          span: ({ children, className, node: _node, ...props }) => (
            <span {...props} className={className} {...(className?.includes("katex-display")
              ? { tabIndex: 0, role: "region", "aria-label": "Scrollable equation" }
              : {})}>{children}</span>
          ),
          a: ({ children, href, node: _node, ...props }) => (
            <a {...props} href={href} {...(href?.startsWith("https://") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>{children}</a>
          ),
          table: ({ children, node: _node, ...props }) => <div className="lesson-table-scroll" tabIndex={0} role="region" aria-label="Scrollable course table"><table {...props}>{children}</table></div>,
        }}
      >
        {text}
      </ReactMarkdown>
    </Wrapper>
  );
}

export function LessonPractice({ items }: { items: { question: string; solution: string }[] }) {
  return (
    <section className="panel glass">
      <h2>Recall, calculate and apply</h2>
      <p>Attempt these before opening the worked reasoning. These practice prompts do not record a score.</p>
      {items.map((item, index) => (
        <div className="lesson-practice" key={index}>
          <LessonContent text={item.question} />
          <details>
            <summary>Show reasoning</summary>
            <LessonContent text={item.solution} />
          </details>
        </div>
      ))}
    </section>
  );
}
