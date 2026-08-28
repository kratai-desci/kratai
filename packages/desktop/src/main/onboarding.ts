import * as fs from 'fs';
import * as path from 'path';

interface Card {
	file: string;
	caption: string;
}

const CARDS: Card[] = [
	{ file: 'hero.png', caption: 'See your up-to-date architecture, always in sync with the code.' },
	{ file: 'stack.png', caption: 'Stack Layer — the overview: each folder as a drillable, stackable sheet.' },
	{ file: 'class.png', caption: 'Class Diagram — click into a folder to see its classes and dependencies.' }
];

function cardsForTheme(assetsDir: string, theme: 'light' | 'dark'): { src: string; caption: string }[] {
	return CARDS.map(c => {
		const buffer = fs.readFileSync(path.join(assetsDir, 'onboarding', theme, c.file));
		return { src: `data:image/png;base64,${buffer.toString('base64')}`, caption: c.caption };
	});
}

/**
 * Returns a self-contained script (for webContents.executeJavaScript) that
 * renders a first-run onboarding overlay directly into the loaded page - no
 * changes to the shared view server/shell, since this is desktop-only.
 * Both light and dark card sets are embedded; the injected script picks
 * whichever matches the page's own current theme (same detection the shell
 * itself uses - see viewShell.ts's effectiveTheme), so the overlay looks
 * like part of the app rather than a mismatched pop-up. Guards against
 * double-injection so replaying it (Help menu) is safe even if an old
 * overlay instance is still around.
 */
export function getOnboardingScript(assetsDir: string): string {
	const lightCards = cardsForTheme(assetsDir, 'light');
	const darkCards = cardsForTheme(assetsDir, 'dark');

	return `(function () {
		var existing = document.getElementById('kratai-onboarding');
		if (existing) existing.remove();

		var lightCards = ${JSON.stringify(lightCards)};
		var darkCards = ${JSON.stringify(darkCards)};

		var storedTheme = null;
		try { storedTheme = localStorage.getItem('kratai-theme'); } catch (e) {}
		var theme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

		var colors = theme === 'dark'
			? { surface: '#131A2E', border: '#262E4E', text: '#E8ECFB', dim: '#939CBE', accent: '#6D93F5', accentText: '#0A0E19', imgBg: '#0A0E19' }
			: { surface: '#FFFFFF', border: '#DCE3F2', text: '#17203A', dim: '#5C6785', accent: '#3459E0', accentText: '#FFFFFF', imgBg: '#F4F7FD' };
		var cards = theme === 'dark' ? darkCards : lightCards;
		var index = 0;

		var overlay = document.createElement('div');
		overlay.id = 'kratai-onboarding';
		overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(6,9,18,0.72);'
			+ 'display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,-apple-system,\\'Segoe UI\\',system-ui,sans-serif;';

		var card = document.createElement('div');
		card.style.cssText = 'width:min(820px,92vw);background:' + colors.surface + ';border:1px solid ' + colors.border + ';border-radius:16px;'
			+ 'overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;';
		overlay.appendChild(card);

		var img = document.createElement('img');
		img.style.cssText = 'width:100%;max-height:60vh;object-fit:contain;display:block;background:' + colors.imgBg + ';';
		card.appendChild(img);

		var body = document.createElement('div');
		body.style.cssText = 'padding:26px 30px;display:flex;flex-direction:column;gap:22px;';
		card.appendChild(body);

		var caption = document.createElement('p');
		caption.style.cssText = 'margin:0;color:' + colors.text + ';font-size:19px;line-height:1.5;';
		body.appendChild(caption);

		var footer = document.createElement('div');
		footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
		body.appendChild(footer);

		var dots = document.createElement('div');
		dots.style.cssText = 'display:flex;gap:6px;';
		footer.appendChild(dots);
		var dotEls = cards.map(function () {
			var d = document.createElement('span');
			d.style.cssText = 'width:6px;height:6px;border-radius:50%;background:' + colors.border + ';transition:background 0.15s ease;';
			dots.appendChild(d);
			return d;
		});

		var actions = document.createElement('div');
		actions.style.cssText = 'display:flex;align-items:center;gap:16px;';
		footer.appendChild(actions);

		var skip = document.createElement('button');
		skip.textContent = 'Skip';
		skip.style.cssText = 'border:none;background:none;color:' + colors.dim + ';font-size:15px;cursor:pointer;padding:0;';
		skip.addEventListener('click', function () { overlay.remove(); });
		actions.appendChild(skip);

		var next = document.createElement('button');
		next.style.cssText = 'border:none;background:' + colors.accent + ';color:' + colors.accentText + ';font-weight:650;font-size:15px;'
			+ 'padding:11px 22px;border-radius:9px;cursor:pointer;';
		next.addEventListener('click', function () {
			if (index === cards.length - 1) { overlay.remove(); return; }
			index += 1;
			render();
		});
		actions.appendChild(next);

		function render() {
			img.src = cards[index].src;
			caption.textContent = cards[index].caption;
			next.textContent = index === cards.length - 1 ? 'Enter the app' : 'Next';
			dotEls.forEach(function (d, i) { d.style.background = i === index ? colors.accent : colors.border; });
		}
		render();

		document.body.appendChild(overlay);
	})();`;
}
