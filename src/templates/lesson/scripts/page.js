const dispatchEvent = (name, detail) => {
	document.dispatchEvent(new CustomEvent(name, { detail }))
}

const loadAndReplaceDocument = async settings => {
	const fixRelativeLinks = (html, pageUrl) => {
		return html.replace(/(href|src)=(["'])(?!https?:\/\/|\/\/|#)([^"']+)/g, (_, attr, quote, link) => {
			return `${attr}=${quote}${new URL(link, pageUrl).href}${quote}`
		})
	}

	const { pageUrl, disableContextMenu } = settings
	const response = await fetch(pageUrl)
	const text = await response.text()
	const html = fixRelativeLinks(text, pageUrl)
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, 'text/html')
	document.body.innerHTML = doc.body.innerHTML

	if (!disableContextMenu) return
	document.addEventListener('contextmenu', event => event.preventDefault())
}

const setupIntersectionObserverForNav = () => {
	const observer = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			const isActive = entry.isIntersecting
			entry.target.classList.toggle('active', isActive)
		})

		const current = document.querySelector('section .active[id]')
		if (!current) return

		const { id } = current
		if (!id) return

		// const activate = document.querySelector(`nav li a[href="#${id}"]`).parentElement
		document.querySelectorAll('nav li.active').forEach(link => link.classList.remove('active'))
	}, { rootMargin: '-4% 0px -10% 0px' })

	document.querySelectorAll('section [id]').forEach(heading => observer.observe(heading))
}

const setupVideoToggles = () => {
	const storageKey = 'video-states'

	const saveToggleState = (id, isOpen) => {
		const states = JSON.parse(localStorage.getItem(storageKey) || '{ }')
		const updatedStates = { ...states, [id]: isOpen }
		localStorage.setItem(storageKey, JSON.stringify(updatedStates))
	}

	const getAllVideoSummaries = () => {
		return [ ...document.querySelectorAll('summary.video') ]
	}

	const loadToggleStates = () => {
		const videoStates = JSON.parse(localStorage.getItem(storageKey) || '{ }')
		Object.entries(videoStates).forEach(([ id, isOpen ]) => {
			const video = document.querySelector(`[src="${id}"]`)
			if (!video) return

			const parent = video.closest('details')
			if (!parent) return

			parent.open = isOpen
		})
	}

	const setupClickListeners = () => {
		getAllVideoSummaries().forEach(summary => {
			summary.addEventListener('click', () => {
				const parent = summary.parentElement
				if (!parent || parent.nodeName !== 'DETAILS') return

				const video = parent.querySelector('iframe, embed, object, video')
				if (!video) return

				const src = video.src
				if (!src) return

				saveToggleState(src, !parent.open)
			})
		})
	}

	const setupShortcutListener = () => {
		document.addEventListener('keydown', event => {
			const { key, ctrlKey, shiftKey } = event
			if (!ctrlKey || !shiftKey) return
			if (key.toLocaleLowerCase() !== 'v') return

			const details = getAllVideoSummaries().map(video => video.parentElement)
				.filter(Boolean).filter(detail => detail.nodeName === 'DETAILS')

			const openCount = details.filter(detail => detail.open).length
			const shouldOpen = openCount < details.length - openCount
			details.forEach(detail => detail.open = shouldOpen)
		})
	}

	loadToggleStates()
	setupClickListeners()
	setupShortcutListener()
}

const setupCodeSubmissions = () => {
	const exerciseSubmissions = document.querySelectorAll('.exercise-submission')

	const validExerciseSubmissions = [ ...exerciseSubmissions ].filter(element => {
		const { parentElement } = element
		if (!parentElement) return false

		const h2 = parentElement.querySelector('h2')
		if (!h2) return false

		const { id } = h2
		if (!id) return false

		const textarea = element.querySelector('textarea')
		if (!textarea) return false

		const submitButton = element.querySelector('button')
		if (!submitButton) return false

		return true
	})

	const exerciseCount = validExerciseSubmissions.length

	validExerciseSubmissions.forEach(element => {
		const { parentElement, dataset } = element

		const id = parentElement.querySelector('h2')?.id
		const textarea = element.querySelector('textarea')
		const submitButton = element.querySelector('button')

		const { language } = dataset || { language: 'plaintext' }

		// allow "tab" to be entered in the textarea
		textarea.addEventListener('keydown', event => {
			if (event.key !== 'Tab') return
			event.preventDefault()

			const { selectionStart, selectionEnd } = textarea
			const value = textarea.value
			const before = value.slice(0, selectionStart)
			const after = value.slice(selectionEnd)

			// insert tab character at the cursor position
			textarea.value = `${before}\t${after}`
			textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
		})

		const toggleCode = () => {
			const pre = document.createElement('pre')
			const code = document.createElement('code')
			pre.appendChild(code)
			element.insertBefore(pre, textarea)
			code.innerHTML = hljs.highlight(textarea.value, { language }).value

			// hide the textarea and show the pre > code
			textarea.style.display = 'none'
			pre.style.display = 'block'

			pre.addEventListener('click', () => {
				textarea.style.display = 'block'
				textarea.focus()

				// delete the pre > code and show the textarea
				element.removeChild(pre)
			})
		}

		textarea.addEventListener('blur', () => {
			const value = textarea.value.trim()
			if (value) toggleCode()
		})

		submitButton.addEventListener('click', () => {
			const code = textarea.value.trim()
			if (!code) return

			dispatchEvent('code-submitted', { id, code, exerciseCount })
			submitButton.textContent = 'Submitted!'
			setTimeout(() => submitButton.textContent = 'Submit', 1000)
		})
	})
}

const disableCourseLinks = () => {
	[ ...document.querySelectorAll('aside .top a') ].forEach(a => {
		if (a.href.startsWith('https://github.com/')) return
		a.href = '#'
	})
}

const setupContentLinks = () => {
	[ ...document.querySelectorAll('#content a') ].forEach(a => {
		if (!a.href.startsWith('#') && !a.target) a.target = '_blank'
	})
}

const setupCodeCopyElements = () => {
	const createCopyButton = parent => {
		const button = document.createElement('button')
		button.classList.add('copy')
		button.textContent = 'Copy'
		parent.appendChild(button)
		return button
	}

	const broadcastCopyEvent = code => {
		dispatchEvent('code-copied', { code })
	}

	document.querySelectorAll('pre > code').forEach(code => {
		const button = createCopyButton(code.parentElement)
		button.addEventListener('click', async () => {
			const text = code.textContent
			await navigator.clipboard.writeText(text)
			button.textContent = 'Copied!'
			setTimeout(() => button.textContent = 'Copy', 1000)
			broadcastCopyEvent(code.textContent)
		})

		code.addEventListener('copy', () => {
			broadcastCopyEvent(code.textContent)
		})
	})
}

const setupHintAndSolutionTracking = () => {
	[ ...document.querySelectorAll('h2') ].forEach(h2 => {
		const text = h2.textContent.toLowerCase()
		const type = text.includes('hint') ? 'hint' : text.includes('solution') ? 'solution' : null
		if (!type) return

		const details = [ ...h2.parentElement.querySelectorAll('details') ]
		details.forEach(detail => {
			detail.addEventListener('toggle', () => {
				if (!detail.open) return

				const { textContent } = detail.querySelector('summary')
				const { id } = h2
				const text = textContent.trim()
				dispatchEvent(`${type}-opened`, { id, text })
			})
		})
	})
}

const addCompletionBar = () => {
	// add div as first child of body to hold the completion slider
	const completionBar = document.createElement('div')
	completionBar.classList.add('completion-bar')
	document.body.insertBefore(completionBar, document.body.firstChild)

	const completionFill = document.createElement('div')
	completionFill.classList.add('completion-fill')
	completionBar.appendChild(completionFill)
	// set the width of the fill to 0% initially
	completionFill.style.width = '0%'

	document.addEventListener('update-completion', async event => {
		console.log('update-completion event:', event)
		const { detail } = event
		const { percent } = detail || { percent: 0 }
		completionFill.style.width = `${Math.round(percent)}%`

		const delay = async ms => new Promise(resolve => setTimeout(resolve, ms))
		if (Math.round(percent) >= 100) {
			await delay(600)
			completionBar.classList.add('completed')
			completionFill.textContent = 'Completed!'

			await delay(5000)
			completionBar.classList.remove('completed')
			completionBar.classList.add('fadeout')
			completionFill.textContent = ''
		}
	})
}


export const loadPage = async settings => {
	await loadAndReplaceDocument(settings)

	setupIntersectionObserverForNav()
	setupVideoToggles()
	disableCourseLinks()
	setupContentLinks()
	setupCodeCopyElements()
	setupHintAndSolutionTracking()
	setupCodeSubmissions()
	addCompletionBar()
}