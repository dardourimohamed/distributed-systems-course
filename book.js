// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
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
