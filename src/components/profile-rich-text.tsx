import { Fragment } from "react";

function parseBlocks(content: string) {
  return content
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line));
      const isBulletBlock = lines.length > 0 && bulletLines.length === lines.length;

      return {
        raw: block,
        lines,
        isBulletBlock,
      };
    });
}

export function ProfileRichText({
  content,
  emptyLabel,
  className = "",
}: {
  content?: string;
  emptyLabel: string;
  className?: string;
}) {
  const trimmed = (content || "").trim();
  if (!trimmed) {
    return <p className={`text-sm leading-7 text-slate-500 ${className}`.trim()}>{emptyLabel}</p>;
  }

  const blocks = parseBlocks(trimmed);

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {blocks.map((block, blockIndex) =>
        block.isBulletBlock ? (
          <ul
            key={`${block.raw}-${blockIndex}`}
            className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700"
          >
            {block.lines.map((line, index) => (
              <li key={`${line}-${index}`} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span>{line.replace(/^[-*•]\s+/, "")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div
            key={`${block.raw}-${blockIndex}`}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm leading-7 text-slate-700"
          >
            {block.lines.map((line, index) => (
              <Fragment key={`${line}-${index}`}>
                <p>{line}</p>
                {index < block.lines.length - 1 ? <div className="h-2" /> : null}
              </Fragment>
            ))}
          </div>
        )
      )}
    </div>
  );
}
