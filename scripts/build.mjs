import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceFiles = ["index.html", "styles.css", "app.js", "weather.js"];

/**
 * 정적 배포 폴더를 만들고 공개 가능한 Supabase 설정만 JavaScript 파일로 생성합니다.
 * service_role 또는 secret 키를 받는 환경변수는 애초에 정의하지 않습니다.
 */
export async function buildGreenOn({ rootDirectory, outputDirectory, supabaseUrl, publishableKey }) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    throw new Error("SUPABASE_URL 형식이 올바르지 않습니다.");
  }

  if (!/^(sb_publishable_|eyJ)/.test(publishableKey)) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY가 필요합니다.");
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  for (const fileName of sourceFiles) {
    await cp(join(rootDirectory, fileName), join(outputDirectory, fileName));
  }

  // 화면에서 사용하는 공개 이미지 자산도 Render 정적 배포 폴더에 함께 복사합니다.
  await cp(join(rootDirectory, "assets"), join(outputDirectory, "assets"), { recursive: true });

  const publicConfig = `// Render 빌드 시 생성되는 공개 클라이언트 설정입니다.\nwindow.GREENON_CONFIG = ${JSON.stringify({
    supabaseUrl,
    supabasePublishableKey: publishableKey,
  }, null, 2)};\n`;

  await writeFile(join(outputDirectory, "supabase-config.js"), publicConfig, "utf8");
  return { outputDirectory, copiedFiles: [...sourceFiles, "assets/", "supabase-config.js"] };
}

const isDirectRun = globalThis.process?.argv?.[1]
  && fileURLToPath(import.meta.url) === globalThis.process.argv[1];

if (isDirectRun) {
  const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
  await buildGreenOn({
    rootDirectory,
    outputDirectory: join(rootDirectory, "dist"),
    supabaseUrl: globalThis.process.env.SUPABASE_URL ?? "",
    publishableKey: globalThis.process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  });
  console.log("Carrier GreenON production build completed: dist/");
}
