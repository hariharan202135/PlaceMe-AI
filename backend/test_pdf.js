const fs = require('fs');
const puppeteer = require('puppeteer');

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      background-color: #ffffff !important;
      color: #111827 !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #printable-resume-preview {
      width: 100% !important;
      transform: none !important;
      box-shadow: none !important;
      border: none !important;
    }
  </style>
</head>
<body>
  <div style="width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff;">
    <div class="border border-border bg-white text-black p-8 rounded-2xl min-h-[1130px] font-sans shadow-xl text-left" id="printable-resume-preview">
      <div class="space-y-5 text-sm text-gray-900">
        <div class="flex items-center space-x-6 border-b-2 border-black pb-4 text-left">
          <div class="flex-1 space-y-1">
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;">JAYASURIYA</h2>
            <span style="font-size: 14px; font-weight: bold; color: #4b5563;">AI ENGINEER</span>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
              <span>📞 +919894995725</span> | <span>📧 hariharanandha2005@gmail.com</span>
            </div>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <h3 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Professional Summary</h3>
          <p style="font-size: 12px; color: #374151;">Experienced AI Engineer specializing in machine learning and full-stack development.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

async function test() {
  console.log("1. Received HTML length:", sampleHtml.length);
  fs.writeFileSync('debug.html', sampleHtml);
  console.log("2. Saved to debug.html");
  console.log("3. Resume in HTML:", sampleHtml.includes("printable-resume-preview"));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  // Step 4
  await page.setContent(sampleHtml, { waitUntil: "networkidle0" });

  // Step 5
  await page.waitForSelector("#printable-resume-preview", {
    visible: true,
    timeout: 10000
  });

  // Step 9: Print body innerHTML length and selector outerHTML length
  const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
  const selectorLen = await page.evaluate(() => document.querySelector("#printable-resume-preview")?.outerHTML.length);
  console.log("9. document.body.innerHTML.length:", bodyLen);
  console.log("9. document.querySelector('#printable-resume-preview')?.outerHTML.length:", selectorLen);

  // Step 6
  await page.screenshot({
    path: "debug.png",
    fullPage: true
  });
  console.log("6. Saved screenshot to debug.png");

  // Step 8 & PDF generation
  await page.emulateMediaType('screen');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  fs.writeFileSync('debug.pdf', pdfBuffer);
  console.log("Generated debug.pdf, size:", pdfBuffer.length);

  await browser.close();
}

test().catch(console.error);
