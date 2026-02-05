// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize syntax highlighting for code blocks
    // mdBook loads highlight.js but doesn't initialize it for all languages
    if (typeof hljs !== 'undefined') {
        // Highlight all code blocks that haven't been highlighted yet
        document.querySelectorAll('pre code[class*="language-"]').forEach((block) => {
            // Only highlight if not already processed by mdBook
            if (!block.classList.contains('hljs')) {
                hljs.highlightElement(block);
            }
        });
    }

    // Create and append a module script to import mermaid
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

        // Initialize mermaid with configuration
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        // Wait a bit to ensure the DOM is fully ready
        // then run mermaid to render all .mermaid elements
        await mermaid.run();
    `;
    document.head.appendChild(script);
});
