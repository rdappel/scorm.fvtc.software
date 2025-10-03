export const initializeTheme = () => {
	const themeKey = 'fvtc.software-theme'

	const themePicker = document.querySelector('.theme-picker')
	if (!themePicker) return

	const themeButtons = themePicker.querySelectorAll('.theme-picker button')
	if (!themeButtons) return

	const hljsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github{theme}.min.css'
	const ghmdUrl = 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown{theme}.min.css'

	const hljsLink = document.querySelector('link[href*="highlight.js"]')
	const ghmdLink = document.querySelector('link[href*="github-markdown-css"]')

	const storedTheme = localStorage.getItem(themeKey) || 'system'
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

	const applyTheme = theme => {
		const isDark = theme === 'dark' || (theme === 'system' && prefersDark.matches)
		hljsLink && (hljsLink.href = hljsUrl.replace('{theme}', isDark ? '-dark' : ''))
		ghmdLink && (ghmdLink.href = ghmdUrl.replace('{theme}', isDark ? '-dark' : '-light'))
		document.body.classList.toggle('dark', isDark)
		document.body.classList.toggle('light', !isDark)
		themePicker.querySelector('.selected')?.classList.remove('selected')
		themePicker.querySelector(`button#${theme}-theme`)?.classList.add('selected')
		localStorage.setItem(themeKey, theme)
		console.log(`Theme set to ${theme}`)
	}

	applyTheme(storedTheme)

	themeButtons.forEach(button => {
		button.addEventListener('click', () => {
			const { id } = button
			if (!id) return
			applyTheme(id.split('-')[0])
		})
	})

	prefersDark.addEventListener('change', () => {
		const theme = localStorage.getItem(themeKey) || 'system'
		if (theme === 'system') applyTheme('system')
	})
}