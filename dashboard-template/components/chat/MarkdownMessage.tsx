"use client" // Requires useState for copy button state; renders interactive markdown content

import { useState, type ReactNode } from "react"

import Markdown from "react-markdown"
import Link from "next/link"
import { Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarkdownMessageProps {
  content: string
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (typeof node === "object" && node !== null && "props" in node) {
    const el = node as { props: { children?: ReactNode } }
    return extractText(el.props.children)
  }
  return ""
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleCopy}
      className="absolute top-2 right-2 h-7 w-7 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label="Copy code"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </Button>
  )
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <Markdown
      components={{
        pre({ children }) {
          const text = extractText(children)
          return (
            <pre className="group relative bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs">
              <CopyButton text={text} />
              {children}
            </pre>
          )
        },
        code({ children, className }) {
          const isBlock = className?.startsWith("language-")
          if (isBlock) {
            return <code className={cn("font-mono text-xs", className)}>{children}</code>
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          )
        },
        a({ href, children }) {
          const isInternal = href?.startsWith("/")
          if (isInternal) {
            return (
              <Link href={href!} className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
                {children}
              </Link>
            )
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              {children}
            </a>
          )
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 space-y-1 my-1.5">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 space-y-1 my-1.5">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          )
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold my-2">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-base font-semibold my-1.5">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-sm font-semibold my-1">{children}</h3>
        },
        p({ children }) {
          return <p className="my-1.5 leading-relaxed">{children}</p>
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>
        },
      }}
    >
      {content}
    </Markdown>
  )
}
