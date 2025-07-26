const playwright = require("playwright-core");

// 日付と時刻をフォーマットする関数
function getDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function testCreateProject() {
  let browser;

  try {
    console.log("=== MulmoCast Playwright Test ===");
    console.log("1. Connecting to Electron app via CDP on port 9222...");

    // Chrome DevTools Protocolで接続
    browser = await playwright.chromium.connectOverCDP("http://localhost:9222/");
    console.log("✓ Connected successfully");

    // コンテキストとページを取得
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    const page = contexts[0].pages()[0];
    console.log("✓ Got page from Electron app");

    // ダッシュボードに移動（念のため）
    console.log("\n2. Navigating to dashboard...");
    await page.goto("http://localhost:5173/#/");
    await page.waitForLoadState("networkidle");
    console.log("✓ Dashboard loaded");

    // 新規作成ボタンをクリック
    console.log('\n3. Clicking "新規作成" button...');
    await page.click('button:has-text("新規作成")');
    await page.waitForSelector('input[placeholder="Enter project title"]');
    console.log("✓ New project dialog opened");

    // プロジェクトタイトルを入力（日付＋時刻）
    const projectTitle = getDateTimeString();
    console.log(`\n4. Entering project title: ${projectTitle}`);
    await page.fill('input[placeholder="Enter project title"]', projectTitle);
    console.log("✓ Project title entered");

    // Createボタンをクリック
    console.log('\n5. Clicking "Create" button...');
    await page.click('button:has-text("Create")');

    // プロジェクトページが読み込まれるまで待機
    await page.waitForSelector('h1:has-text("' + projectTitle + '")');
    console.log("✓ Project created and page loaded");

    // Scriptタブのテスト
    console.log("\n6. Testing Script tabs...");
    const tabs = ["Text", "YAML", "JSON", "Media", "Style", "Ref"];

    for (const tab of tabs) {
      console.log(`   - Clicking "${tab}" tab...`);
      await page.click(`[role="tab"]:has-text("${tab}")`);

      // タブがアクティブになるまで少し待機
      await page.waitForTimeout(500);

      // タブがアクティブになったことを確認
      const isSelected = await page.$eval(
        `[role="tab"]:has-text("${tab}")`,
        (el) => el.getAttribute("aria-selected") === "true",
      );

      if (isSelected) {
        console.log(`   ✓ "${tab}" tab is now active`);
      } else {
        console.log(`   ✗ Failed to activate "${tab}" tab`);
      }
    }

    console.log("\n=== Test completed successfully! ===");
    console.log(`Project "${projectTitle}" was created and all Script tabs were tested.`);
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    throw error;
  } finally {
    // ブラウザ接続を閉じる
    if (browser) {
      await browser.close();
      console.log("\nBrowser connection closed.");
    }
  }
}

// テストを実行
console.log("Starting test in 3 seconds...");
console.log("Make sure the Electron app is running with: yarn start\n");

setTimeout(() => {
  testCreateProject().catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
}, 3000);
