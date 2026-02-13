// Mermaid initialization for mdBook
// This script loads mermaid.js and renders all mermaid diagrams

(function() {
    'use strict';

    function initMermaid() {
        // Create a module script to load mermaid from CDN
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

            // Render all mermaid diagrams
            mermaid.run();
        `;
        document.head.appendChild(script);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMermaid);
    } else {
        initMermaid();
    }
})();
