export interface FoldableFolder<TClass> {
	fullPath: string;
	name: string;
	classes: TClass[];
}

/**
 * Prefixes a class name with the folder it folded up from ("sign-in" +
 * "page" -> "sign-in/page") for use in a foldSingleClassFolders rename
 * callback. Module-style names (kratai's convention for a whole-file
 * pseudo-class, e.g. "[page]") keep their brackets on the *outside* of the
 * prefixed name ("[sign-in/page]", not "sign-in/[page]") - callers that
 * detect "is this a module" by checking whether the name starts with "["
 * (see @kratai/diagram-view's ClassBoxRenderer) would otherwise silently
 * stop recognizing it as a module once prefixed.
 *
 * The non-module branch strips any leading/trailing brackets from the
 * folder name itself before using it as a prefix - a folder named "[id]" or
 * "[...slug]" (Next.js's own syntax for a dynamic route segment) is common
 * and would otherwise make the prefixed name start with "[" by coincidence,
 * fooling that same module check into treating an ordinary class as a
 * module and mangling its display name.
 */
export function prefixFoldedClassName(originalName: string, originFolderName: string): string {
	const isModule = originalName.startsWith('[') && originalName.endsWith(']');
	if (isModule) {
		return `[${originFolderName}/${originalName.slice(1, -1)}]`;
	}
	const safeFolderName = originFolderName.replace(/^\[+/, '').replace(/\]+$/, '');
	return `${safeFolderName}/${originalName}`;
}

/**
 * Folds a leaf folder that owns exactly one class up into its immediate
 * parent, one level only (no recursion) - so a routing convention that
 * scatters one file per folder (Next.js's app/auth/sign-in/page.tsx,
 * app/auth/sign-up/page.tsx, ...) collapses into a single "auth" layer
 * holding both classes, instead of each becoming its own near-empty layer.
 *
 * A folded class gets renamed to "<origin folder name>/<original name>" -
 * necessary, not cosmetic: these route files are frequently anonymous
 * modules (name "page" or "index"), so two folded siblings would otherwise
 * both render as an indistinguishable "page" inside the same merged box.
 *
 * Shared between @kratai/diagram-view's FolderBoxRenderer and the CLI's
 * stack-layer view so both keep showing the exact same set of layers -
 * `makeFolder` lets each caller construct its own concrete folder type
 * (DiagramFolderNode vs. the stack view's plain folder shape) rather than
 * this function assuming one.
 */
export function foldSingleClassFolders<TClass, F extends FoldableFolder<TClass>>(
	folders: F[],
	renameClass: (cls: TClass, originFolderName: string) => TClass,
	makeFolder: (fullPath: string, name: string, classes: TClass[]) => F
): F[] {
	function parentPath(fullPath: string): string {
		const idx = fullPath.lastIndexOf('/');
		return idx === -1 ? '' : fullPath.slice(0, idx);
	}

	const merged = new Map<string, F>();

	for (const folder of folders) {
		const isSingleClass = folder.classes.length === 1;
		const targetPath = isSingleClass ? parentPath(folder.fullPath) : folder.fullPath;
		const classes = isSingleClass
			? folder.classes.map(c => renameClass(c, folder.name))
			: folder.classes;

		const existing = merged.get(targetPath);
		if (existing) {
			existing.classes = existing.classes.concat(classes);
		} else {
			// If merging INTO a path that was never itself a real leaf folder
			// (e.g. "auth" merging sign-in + sign-up but never directly held
			// classes of its own), synthesize its display name from the last
			// path segment - "workspace" mirrors FolderStructureBuilder's own
			// root-bucket name for the (rare) case that path is empty.
			const targetName = targetPath === folder.fullPath
				? folder.name
				: (targetPath.split('/').pop() || 'workspace');
			merged.set(targetPath, makeFolder(targetPath, targetName, classes.slice()));
		}
	}

	return Array.from(merged.values());
}
