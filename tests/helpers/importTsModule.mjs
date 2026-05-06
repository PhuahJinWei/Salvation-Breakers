import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = new URL('../../', import.meta.url);
const GAME_SRC = new URL('src/game/', ROOT);
const OUT_DIR = join(tmpdir(), 'salvation-breakers-tests', String(Date.now()));

let prepared = false;

export async function importGameModule(moduleName) {
	prepareGameModules();
	return import(pathToFileURL(join(OUT_DIR, 'game', moduleName + '.mjs')).href);
}

function prepareGameModules() {
	if (prepared) return;
	prepared = true;

	rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(join(OUT_DIR, 'game'), { recursive: true });

	const files = [
		'combatMath.ts',
		'config.ts',
		'enemySprites.ts',
		'shopConfig.ts',
		'shopDragRules.ts',
		'shopGunView.ts',
		'shopMerge.ts',
		'shopPlacement.ts',
		'shopState.ts',
		'shopTypes.ts',
		'spriteAnimation.ts',
		'state.ts',
		'traits.ts',
		'types.ts',
		'utils.ts',
		'weaponRuntime.ts',
	];

	for (const file of files) {
		transpileGameFile(file);
	}
}

function transpileGameFile(file) {
	const sourceUrl = new URL(file, GAME_SRC);
	const source = readFileSync(sourceUrl, 'utf8');
	let output = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ES2022,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;

	output = rewriteRelativeImports(output);

	const outputPath = join(OUT_DIR, 'game', basename(file, '.ts') + '.mjs');
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, output);
}

function rewriteRelativeImports(source) {
	return source
		.replace(/from\s+(['"])(\.\/[^'"]+)\1/g, 'from $1$2.mjs$1')
		.replace(/import\s*\(\s*(['"])(\.\/[^'"]+)\1\s*\)/g, 'import($1$2.mjs$1)');
}
