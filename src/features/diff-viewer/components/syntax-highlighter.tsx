"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

// Lightweight syntax highlighting using regex patterns
interface Token {
  type: string;
  value: string;
}

const PATTERNS: Record<string, RegExp[]> = {
  comment: [/\/\/.*/g, /\/\*[\s\S]*?\*\//g, /#.*/g],
  string: [/"(?:\\.|[^"\\])*"/g, /'(?:\\.|[^'\\])*'/g, /`(?:\\.|[^`\\])*`/g],
  keyword: [
    /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|readonly|abstract)\b/g,
  ],
  number: [/\b\d+\.?\d*\b/g],
  operator: [/[+\-*/%=<>!&|^~?:]+/g],
  punctuation: [/[{}()\[\];,.]/g],
};

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let remaining = code;
  let position = 0;

  while (position < code.length) {
    let matched = false;

    for (const [type, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(remaining);
        
        if (match && match.index === 0) {
          if (position < match.index) {
            tokens.push({
              type: "text",
              value: remaining.substring(0, match.index),
            });
          }
          tokens.push({ type, value: match[0] });
          remaining = remaining.substring(match.index + match[0].length);
          position += match.index + match[0].length;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      const nextPos = Math.min(position + 1, code.length);
      tokens.push({ type: "text", value: code[position] });
      remaining = code.substring(nextPos);
      position = nextPos;
    }
  }

  return tokens;
}

const TOKEN_STYLES: Record<string, string> = {
  comment: "text-green-600 dark:text-green-400 italic opacity-70",
  string: "text-amber-600 dark:text-amber-400",
  keyword: "text-purple-600 dark:text-purple-400 font-semibold",
  number: "text-blue-600 dark:text-blue-400",
  operator: "text-rose-600 dark:text-rose-400",
  punctuation: "text-slate-600 dark:text-slate-400",
  text: "text-foreground",
};

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  className?: string;
}

export function SyntaxHighlighter({
  code,
  language = "javascript",
  className,
}: SyntaxHighlighterProps) {
  const tokens = useMemo(() => tokenize(code), [code]);

  return (
    <span className={cn("inline", className)}>
      {tokens.map((token, idx) => (
        <span key={idx} className={TOKEN_STYLES[token.type] || TOKEN_STYLES.text}>
          {token.value}
        </span>
      ))}
    </span>
  );
}

interface HighlightedLineProps {
  content: string;
  language?: string;
  className?: string;
  enableHighlighting?: boolean;
}

export function HighlightedLine({
  content,
  language,
  className,
  enableHighlighting = true,
}: HighlightedLineProps) {
  if (!enableHighlighting) {
    return <span className={className}>{content || " "}</span>;
  }

  return (
    <SyntaxHighlighter
      code={content || " "}
      language={language}
      className={className}
    />
  );
}
