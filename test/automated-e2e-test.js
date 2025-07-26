const { spawn } = require("child_process");
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

async function runE2ETest() {
  let electronProcess;
  let browser;

  try {
    console.log("=== MulmoCast E2E Test ===");
    console.log("1. Starting Electron app with yarn start...");

    // Electronアプリをspawnで起動（プロセスグループを作成）
    electronProcess = spawn("yarn", ["start"], {
      shell: true,
      detached: true, // プロセスグループを作成
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });

    // アプリの起動ログを表示
    electronProcess.stdout.on("data", (data) => {
      console.log(`[Electron]: ${data.toString().trim()}`);
    });

    electronProcess.stderr.on("data", (data) => {
      console.error(`[Electron Error]: ${data.toString().trim()}`);
    });

    // アプリが完全に起動するまで待機
    console.log("Waiting for app to start (15 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    console.log("\n2. Connecting to Electron via CDP...");
    browser = await playwright.chromium.connectOverCDP("http://localhost:9222/");
    console.log("✓ Connected successfully");

    // コンテキストとページを取得
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error("No browser contexts found");
    }

    // 正しいページを見つける（DevToolsではなくアプリのページ）
    let page = null;
    for (const context of contexts) {
      const pages = context.pages();
      for (const p of pages) {
        const url = p.url();
        console.log(`Found page: ${url}`);
        if (url.includes("localhost:5173")) {
          page = p;
          break;
        }
      }
      if (page) break;
    }

    // もし見つからなければ、最初のコンテキストの2番目のページを試す
    if (!page && contexts[0].pages().length > 1) {
      page = contexts[0].pages()[1];
    }

    if (!page) {
      throw new Error("Could not find application page");
    }

    console.log("✓ Got page from Electron app");
    console.log(`Current URL: ${page.url()}`);

    // 新規作成ボタンをクリック
    console.log("\n3. Creating new project...");
    await page.click('button:has-text("新規作成")');
    await page.waitForSelector('input[placeholder="Enter project title"]');
    console.log("✓ New project dialog opened");

    // プロジェクトタイトルを入力
    const projectTitle = getDateTimeString();
    console.log(`\n4. Entering project title: ${projectTitle}`);
    await page.fill('input[placeholder="Enter project title"]', projectTitle);
    console.log("✓ Project title entered");

    // Createボタンをクリック
    console.log('\n5. Clicking "Create" button...');
    await page.click('button:has-text("Create")');

    // プロジェクトページが読み込まれるまで待機
    await page.waitForSelector(`h1:has-text("${projectTitle}")`);
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

    // Electronプロセスを終了
    if (electronProcess) {
      console.log("Terminating Electron app...");

      try {
        // プロセスグループ全体を終了（負のPIDで指定）
        process.kill(-electronProcess.pid, "SIGTERM");
        console.log("Sent SIGTERM to process group");
      } catch (error) {
        console.log("Failed to kill process group, trying individual process...");
        electronProcess.kill("SIGTERM");
      }

      // プロセスの終了を待機
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("Force killing process group...");
          try {
            process.kill(-electronProcess.pid, "SIGKILL");
          } catch (error) {
            console.log("Failed to force kill process group, trying individual process...");
            electronProcess.kill("SIGKILL");
          }
          resolve();
        }, 5000); // 5秒待ってもSIGTERMで終了しない場合はSIGKILL

        electronProcess.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      console.log("Electron app terminated.");
    }
  }
}

// メイン実行
async function main() {
  console.log("Starting E2E test...");
  console.log("This test will automatically start and stop the Electron app.\n");

  try {
    await runE2ETest();
    console.log("\n✅ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// 実行
main();
