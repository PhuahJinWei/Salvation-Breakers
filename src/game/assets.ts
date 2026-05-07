const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;

export function publicAssetPath(path: string): string {
	if (!path || ABSOLUTE_URL_RE.test(path)) return path;

	const base = import.meta.env?.BASE_URL || '/';
	const normalizedBase = base.endsWith('/') ? base : base + '/';
	const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

	return normalizedBase + normalizedPath;
}

export function publicAssetUrl(path: string): string {
	return `url("${publicAssetPath(path).replace(/"/g, '\\"')}")`;
}
