import { cn } from '@/lib/utils';

interface RichTextRendererProps {
    content: string | string[] | null | undefined;
    className?: string;
}

/**
 * Renders rich text content with Markdown-like formatting support.
 * Supports: **bold**, *italic*, # H1, ## H2, ### H3
 */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
    if (!content) {
        return null;
    }

    // Normalize content to string
    const text = Array.isArray(content) ? content.join('\n') : content;

    if (!text.trim()) {
        return null;
    }

    const lines = text.split('\n');

    return (
        <div className={cn('space-y-1.5', className)}>
            {lines.map((line, index) => {
                if (!line.trim()) {
                    return <div key={index} className="h-2" />;
                }

                // Check for headings
                if (line.startsWith('### ')) {
                    return (
                        <h3 key={index} className="text-base font-semibold text-foreground mt-2">
                            {parseInline(line.slice(4))}
                        </h3>
                    );
                }
                if (line.startsWith('## ')) {
                    return (
                        <h2 key={index} className="text-lg font-semibold text-foreground mt-3">
                            {parseInline(line.slice(3))}
                        </h2>
                    );
                }
                if (line.startsWith('# ')) {
                    return (
                        <h1 key={index} className="text-xl font-bold text-foreground mt-4">
                            {parseInline(line.slice(2))}
                        </h1>
                    );
                }

                return (
                    <p key={index} className="text-sm text-foreground">
                        {parseInline(line)}
                    </p>
                );
            })}
        </div>
    );
}

// Parse inline formatting (bold and italic)
function parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Match bold (**text**) first, then italic (*text*)
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

        // Find the earliest match
        let earliestMatch: RegExpMatchArray | null = null;
        let matchType: 'bold' | 'italic' | null = null;

        if (boldMatch && boldMatch.index !== undefined) {
            earliestMatch = boldMatch;
            matchType = 'bold';
        }

        if (italicMatch && italicMatch.index !== undefined) {
            if (!earliestMatch || italicMatch.index < (earliestMatch.index ?? Infinity)) {
                earliestMatch = italicMatch;
                matchType = 'italic';
            }
        }

        if (earliestMatch && earliestMatch.index !== undefined && matchType) {
            // Add text before match
            if (earliestMatch.index > 0) {
                parts.push(<span key={key++}>{remaining.slice(0, earliestMatch.index)}</span>);
            }
            // Add formatted text
            if (matchType === 'bold') {
                parts.push(<strong key={key++} className="font-bold">{earliestMatch[1]}</strong>);
            } else {
                parts.push(<em key={key++} className="italic">{earliestMatch[1]}</em>);
            }
            remaining = remaining.slice(earliestMatch.index + earliestMatch[0].length);
        } else {
            // No more matches, add remaining text
            parts.push(<span key={key++}>{remaining}</span>);
            break;
        }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}
