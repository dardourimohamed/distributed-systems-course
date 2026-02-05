(function() {
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
        document.addEventListener('DOMContentLoaded', initMermaid);
    } else {
        initMermaid();
    }
})();
