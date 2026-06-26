"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, type ReactNode } from "react";

// A focused renderer for the exact markdown subset buildReadme() emits:
// <div align="center"> blocks, #/##/### headings, --- rules, - lists,
// <sub> footers, and inline images / image-links / links / bold / code.
// Because the generator is the single source of truth, this only needs to
// understand the constructs we produce — not arbitrary markdown.

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

interface Inline {
  nodes: ReactNode[];
  allMedia: boolean; // only images / image-links (used to lay out card rows)
}

function parseInline(input: string): Inline {
  const nodes: ReactNode[] = [];
  let rest = input;
  let k = 0;
  let nonMedia = false;

  while (rest.length) {
    let m: RegExpMatchArray | null;

    if ((m = rest.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/))) {
      nodes.push(
        <a key={k++} href={m[3]} target="_blank" rel="noreferrer">
          <img src={m[2]} alt={m[1]} />
        </a>
      );
      rest = rest.slice(m[0].length);
      continue;
    }
    if ((m = rest.match(/^!\[([^\]]*)\]\(([^)]+)\)/))) {
      nodes.push(<img key={k++} src={m[2]} alt={m[1]} />);
      rest = rest.slice(m[0].length);
      continue;
    }
    if ((m = rest.match(/^\[([^\]]*)\]\(([^)]+)\)/))) {
      nonMedia = true;
      // Link labels can contain **bold** (e.g. featured-project links).
      nodes.push(
        <a key={k++} href={m[2]} target="_blank" rel="noreferrer">
          {parseInline(m[1]).nodes}
        </a>
      );
      rest = rest.slice(m[0].length);
      continue;
    }
    if ((m = rest.match(/^<a href="([^"]+)">([^<]*)<\/a>/))) {
      nonMedia = true;
      nodes.push(
        <a key={k++} href={m[1]} target="_blank" rel="noreferrer">
          {decode(m[2])}
        </a>
      );
      rest = rest.slice(m[0].length);
      continue;
    }
    if ((m = rest.match(/^\*\*([^*]+)\*\*/))) {
      nonMedia = true;
      nodes.push(<strong key={k++}>{decode(m[1])}</strong>);
      rest = rest.slice(m[0].length);
      continue;
    }
    if ((m = rest.match(/^`([^`]+)`/))) {
      nonMedia = true;
      nodes.push(<code key={k++}>{m[1]}</code>);
      rest = rest.slice(m[0].length);
      continue;
    }
    // Plain text up to the next special character…
    if ((m = rest.match(/^[^*`[\]<!]+/))) {
      if (m[0].trim()) nonMedia = true;
      nodes.push(<span key={k++}>{decode(m[0])}</span>);
      rest = rest.slice(m[0].length);
      continue;
    }
    // …otherwise consume one stray character literally.
    nodes.push(<span key={k++}>{rest[0]}</span>);
    if (rest[0].trim()) nonMedia = true;
    rest = rest.slice(1);
  }

  return { nodes, allMedia: nodes.length > 0 && !nonMedia };
}

function parse(md: string): ReactNode[] {
  const lines = md.split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let centered = false;
  let key = 0;

  const flush = () => {
    if (!para.length) return;
    const { nodes, allMedia } = parseInline(para.join(" "));
    para = [];
    if (allMedia) {
      blocks.push(
        <div key={key++} className={`md-media${centered ? " md-center" : ""}`}>
          {nodes}
        </div>
      );
    } else {
      blocks.push(
        <p key={key++} className={centered ? "md-center" : undefined}>
          {nodes}
        </p>
      );
    }
  };

  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();

    if (t === '<div align="center">') {
      flush();
      centered = true;
      i++;
      continue;
    }
    if (t === "</div>") {
      flush();
      centered = false;
      i++;
      continue;
    }
    if (t === "") {
      flush();
      i++;
      continue;
    }
    if (t === "---") {
      flush();
      blocks.push(<hr key={key++} />);
      i++;
      continue;
    }
    const sub = t.match(/^<sub>(.*)<\/sub>$/);
    if (sub) {
      flush();
      blocks.push(
        <p key={key++} className={`md-sub${centered ? " md-center" : ""}`}>
          {parseInline(sub[1]).nodes}
        </p>
      );
      i++;
      continue;
    }
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const inner = parseInline(h[2]).nodes;
      const cls = centered ? "md-center" : undefined;
      blocks.push(
        level === 1 ? (
          <h1 key={key++} className={cls}>{inner}</h1>
        ) : level === 2 ? (
          <h2 key={key++} className={cls}>{inner}</h2>
        ) : (
          <h3 key={key++} className={cls}>{inner}</h3>
        )
      );
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      flush();
      const items: ReactNode[] = [];
      let li = 0;
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[-*]\s+/, "");
        items.push(<li key={li++}>{parseInline(text).nodes}</li>);
        i++;
      }
      blocks.push(<ul key={key++}>{items}</ul>);
      continue;
    }

    para.push(t);
    i++;
  }
  flush();
  return blocks;
}

export default function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parse(markdown), [markdown]);
  return <div className="md-preview">{blocks}</div>;
}
