(function() {
    // Initialize syntax highlighting for code blocks
    function initHighlighting() {
        // mdBook loads highlight.js but may not highlight all languages
        if (typeof hljs !== 'undefined') {
            // Highlight all code blocks that haven't been highlighted yet
            document.querySelectorAll('pre code[class*="language-"]').forEach((block) => {
                // Only highlight if not already processed by mdBook
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
        }
    }

    // Load mermaid.js from CDN and initialize
    function initMermaid() {
        // Check if mermaid is already loaded
        if (typeof mermaid !== 'undefined') {
            renderMermaid();
            return;
        }

        // Create script element to load mermaid.js
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.onload = function() {
            renderMermaid();
        };
        document.head.appendChild(script);
    }

    function renderMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        // Find all mermaid blocks and render them
        const mermaidBlocks = document.querySelectorAll('.mermaid');
        mermaidBlocks.forEach((block, index) => {
            const id = 'mermaid-' + index;
            mermaid.render({
                querySelector: '#' + id
            }).catch(err => console.error('Mermaid render error:', err));
        });

        // Also use mermaid.run() for v10+
        if (typeof mermaid.run === 'function') {
            mermaid.run().catch(err => console.error('Mermaid run error:', err));
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initHighlighting();
            initMermaid();
        });
    } else {
        initHighlighting();
        initMermaid();
    }
})();
