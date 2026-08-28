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

function toDataUri(assetsDir: string, file: string): string {
	const buffer = fs.readFileSync(path.join(assetsDir, file));
	return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Returns a self-contained script (for webContents.executeJavaScript) that
 * renders a first-run onboarding overlay directly into the loaded page - no
 * changes to the shared view server/shell, since this is desktop-only.
 * Guards against double-injection so replaying it (Help menu) is safe even
 * if an old overlay instance is still around.
 */
export function getOnboardingScript(assetsDir: string): string {
	const cards = CARDS.map(c => ({ src: toDataUri(assetsDir, path.join('onboarding', c.file)), caption: c.caption }));

	return `(function () {
		var existing = document.getElementById('kratai-onboarding');
		if (existing) existing.remove();

		var cards = ${JSON.stringify(cards)};
		var index = 0;

		var overlay = document.createElement('div');
		overlay.id = 'kratai-onboarding';
		overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(6,9,18,0.72);'
			+ 'display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,-apple-system,\\'Segoe UI\\',system-ui,sans-serif;';

		var card = document.createElement('div');
		card.style.cssText = 'width:min(820px,92vw);background:#131A2E;border:1px solid #262E4E;border-radius:16px;'
			+ 'overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;';
		overlay.appendChild(card);

		var img = document.createElement('img');
		img.style.cssText = 'width:100%;max-height:60vh;object-fit:contain;display:block;background:#0A0E19;';
		card.appendChild(img);

		var body = document.createElement('div');
		body.style.cssText = 'padding:26px 30px;display:flex;flex-direction:column;gap:22px;';
		card.appendChild(body);

		var caption = document.createElement('p');
		caption.style.cssText = 'margin:0;color:#E8ECFB;font-size:19px;line-height:1.5;';
		body.appendChild(caption);

		var footer = document.createElement('div');
		footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
		body.appendChild(footer);

		var dots = document.createElement('div');
		dots.style.cssText = 'display:flex;gap:6px;';
		footer.appendChild(dots);
		var dotEls = cards.map(function () {
			var d = document.createElement('span');
			d.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#262E4E;transition:background 0.15s ease;';
			dots.appendChild(d);
			return d;
		});

		var actions = document.createElement('div');
		actions.style.cssText = 'display:flex;align-items:center;gap:16px;';
		footer.appendChild(actions);

		var skip = document.createElement('button');
		skip.textContent = 'Skip';
		skip.style.cssText = 'border:none;background:none;color:#939CBE;font-size:15px;cursor:pointer;padding:0;';
		skip.addEventListener('click', function () { overlay.remove(); });
		actions.appendChild(skip);

		var next = document.createElement('button');
		next.style.cssText = 'border:none;background:#6D93F5;color:#0A0E19;font-weight:650;font-size:15px;'
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
			dotEls.forEach(function (d, i) { d.style.background = i === index ? '#6D93F5' : '#262E4E'; });
		}
		render();

		document.body.appendChild(overlay);
	})();`;
}
