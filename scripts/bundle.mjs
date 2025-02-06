import { build } from "esbuild";
import fs from "fs";

const removeExportPlugin = {
	name: "remove-export",
	setup(build) {
		build.onLoad({ filter: /\.js$/ }, async (args) => {
			const source = await fs.promises.readFile(args.path, "utf8");
			const modifiedSource = source
				.replace(/export\s+async\s+function/g, "async function")
				.replace(/export\s+function/g, "function")
				.replace(/export\s+const/g, "const")
				.replace(/export\s+let/g, "let")
				.replace(/export\s+var/g, "var")
				.replace(/export\s+class/g, "class")
				.replace(/export\s+interface/g, "interface")
				.replace(/export\s+type/g, "type")
				.replace(/export\s+\{[^}]+\}/g, "");

			return {
				contents: modifiedSource,
				loader: "js",
			};
		});
	},
};

// ソースマップコメントを追加するプラグイン
const sourceMapPlugin = {
	name: "source-map-comment",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.outputFiles) {
				for (const file of result.outputFiles) {
					if (file.path.endsWith(".js")) {
						const sources =
							file.text
								.match(/\/\* Bundled files: (.*) \*\//)?.[1]
								?.split(", ") || [];
						const sourceComment =
							"/* Bundled from: " + sources.join(", ") + " */\\n\\n";
						file.contents = Buffer.from(sourceComment + file.text);
					}
				}
			}
		});
	},
};

const cleanDistFolder = () => {
	if (fs.existsSync("./dist")) {
		fs.rmSync("./dist", { recursive: true });
	}
	fs.mkdirSync("./dist");
};

const copyAppsscriptJson = () => {
	if (fs.existsSync("./appsscript.json")) {
		fs.copyFileSync("./appsscript.json", "./dist/appsscript.json");
	}
};

async function main() {
	try {
		cleanDistFolder();

		await build({
			entryPoints: ["./src/index.ts"],
			outfile: "./dist/index.js",
			plugins: [removeExportPlugin],
			bundle: true,
			platform: "node",
			target: "es2020",
			charset: "utf8",
			treeShaking: false,
			allowOverwrite: true,
			format: "esm",
		});

		copyAppsscriptJson();
		console.log("Build completed successfully!");
	} catch (err) {
		console.error("Build failed:", err);
		process.exit(1);
	}
}

main();
