// Preloader utility for lazy-loaded components
// This helps preload components when user interaction indicates they might be needed

let preloadedComponents = new Set();

// Preload the StockChart component after initial render
export const preloadStockChart = () => {
  if (!preloadedComponents.has('StockChart')) {
    // Use a timeout to avoid blocking the main thread
    setTimeout(() => {
      import('../components/StockChart.jsx')
        .then(() => {
          preloadedComponents.add('StockChart');
          console.log('✓ StockChart preloaded');
        })
        .catch((error) => {
          console.warn('Failed to preload StockChart:', error);
        });
    }, 1000); // Preload after 1 second
  }
};

// Preload components on user interaction (hover, etc.)
export const preloadOnInteraction = (componentName, importFn) => {
  if (!preloadedComponents.has(componentName)) {
    importFn()
      .then(() => {
        preloadedComponents.add(componentName);
        console.log(`✓ ${componentName} preloaded on interaction`);
      })
      .catch((error) => {
        console.warn(`Failed to preload ${componentName}:`, error);
      });
  }
};

export const resetPreloadCache = () => {
  preloadedComponents.clear();
};
