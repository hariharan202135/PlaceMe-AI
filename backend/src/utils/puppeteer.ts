let browserInstance: any = null;
let isLaunching = false;

export const getBrowserInstance = async (): Promise<any> => {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  if (isLaunching) {
    while (isLaunching) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (browserInstance && browserInstance.isConnected()) {
      return browserInstance;
    }
  }

  isLaunching = true;

  try {
    // 1. Try launching with @sparticuz/chromium + puppeteer-core (for Render / Linux Container environments)
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerCoreModule = await import('puppeteer-core');

      const chromium = chromiumModule.default || (chromiumModule as any);
      const puppeteerCore = puppeteerCoreModule.default || (puppeteerCoreModule as any);

      const execPath = await chromium.executablePath();
      if (execPath) {
        console.log('⚡ Launching Singleton Puppeteer Core via @sparticuz/chromium executablePath:', execPath);
        browserInstance = await puppeteerCore.launch({
          args: [...(chromium.args || []), '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          defaultViewport: (chromium as any).defaultViewport,
          executablePath: execPath,
          headless: (chromium as any).headless === 'shell' ? 'shell' : true
        });
        console.log('🚀 Singleton Chromium browser launched successfully!');
      }
    } catch (sparticuzErr: any) {
      console.warn('Sparticuz Chromium launch notice (switching to standard puppeteer):', sparticuzErr?.message || sparticuzErr);
    }

    // 2. Fallback to standard puppeteer (for Windows local dev / standard Linux environments)
    if (!browserInstance) {
      const puppeteerModule = await import('puppeteer');
      const puppeteer = puppeteerModule.default || (puppeteerModule as any);

      const launchOptions: any = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      };

      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      console.log('⚡ Launching Singleton Standard Puppeteer with options:', launchOptions);
      browserInstance = await puppeteer.launch(launchOptions);
      console.log('🚀 Singleton Standard Puppeteer browser launched successfully!');
    }

    if (!browserInstance) {
      throw new Error('Could not launch Chromium browser instance.');
    }

    browserInstance.on('disconnected', () => {
      console.warn('⚠️ Singleton Chromium browser disconnected. Resetting instance.');
      browserInstance = null;
    });

    return browserInstance;
  } finally {
    isLaunching = false;
  }
};
