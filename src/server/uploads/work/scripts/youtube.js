const dispatchEvent = (name, detail) => {
	document.dispatchEvent(new CustomEvent(name, { detail }))
}

const loadYouTubeAPI = () => {
	return new Promise((resolve) => {
		if (window.YT && window.YT.Player) {
			return resolve()
		}

		window.onYouTubeIframeAPIReady = () => resolve()

		if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
			const script = document.createElement('script')
			script.src = 'https://www.youtube.com/iframe_api'
			document.head.appendChild(script)
		}
	})
}

const formatTime = time => {
	const minutes = Math.floor(time / 60)
	const seconds = Math.floor(time % 60)
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const createGetTimeValues = durationAdjustment => player => {
	const currentTimeRaw = player.getCurrentTime()
	const durationRaw = player.getDuration()

	const currentTimeFormatted = formatTime(currentTimeRaw)
	// const durationFormatted = formatTime(durationRaw)

	const adjustedDurationRaw = durationRaw * durationAdjustment
	const uncappedPercent = currentTimeRaw / adjustedDurationRaw
	const percent = Math.min(1, uncappedPercent)
	const completed = percent >= 1
	return { currentTimeFormatted, currentTimeRaw, percent, adjustedDurationRaw, completed }
}

const initializePlayer = (iframe, settings) => {
	const videoCompletionPercent = settings.score.videoCompletionPercent || 95
	const videoId = iframe.src.split('/embed/')[1].split('?')[0]

	const completionAdjusted = (videoCompletionPercent > 99 ? 99 : videoCompletionPercent) / 100
	const getTimeValues = createGetTimeValues(completionAdjusted)

	iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
	iframe.removeAttribute('allow')

	let videoInterval = null

	return new Promise(resolve => {
		const onReady = ({ target }) => {
			const player = target
			const { adjustedDurationRaw } = getTimeValues(player)
			const title = player.videoTitle || 'Unknown video'
			resolve({ videoId, player, adjustedDurationRaw, title })
		}

		const onStateChange = ({ data, target }) => {
			const { videoTitle } = target
			const title = videoTitle || 'Unknown video'
			const player = target

			const state = { 1: 'playing', 2: 'paused' }[data]
			if (!state) return

			const { currentTimeFormatted, adjustedDurationRaw, percent } = getTimeValues(player)

			const clearAndSetNull = interval => {
				if (!interval) return
				clearInterval(interval)
				interval = null
				console.log('INTERVAL CLEARED')
			}

			clearAndSetNull(videoInterval)
			dispatchEvent('video-progress', { videoId, title, state, currentTimeFormatted, adjustedDurationRaw, percent })

			if (state !== 'playing') return

			// players.forEach((other, otherIndex) => {
			// 	if (otherIndex !== index) other.pauseVideo()
			// })

			videoInterval = setInterval(() => {
				const { currentTimeFormatted, adjustedDurationRaw, percent } = getTimeValues(player)
				const completed = percent >= 1
				const state = completed ? 'completed' : null
				dispatchEvent('video-progress', { videoId, title, state, currentTimeFormatted, adjustedDurationRaw, percent })
				if (completed) clearAndSetNull(videoInterval)
			}, 500)
		}

		const events = { onReady, onStateChange }

		const Player = window.YT?.Player
		if (!Player) return
		/* eslint-disable-next-line no-new */
		new Player(iframe, { events, videoId })
	})
}

export const initializeVideos = async settings => {
	await loadYouTubeAPI()
	const videoElements = document.querySelectorAll('.video-container iframe')

	const promises = [ ...videoElements ].map(iframe => initializePlayer(iframe, settings))
	const videos = (await Promise.all(promises)).reduce((acc, video) => {
		const { videoId, player, adjustedDurationRaw, title } = video
		const initialState = { timeViewed: 0, completed: false }
		acc[videoId] = { player, adjustedDurationRaw, title, ...initialState }
		return acc
	}, { })

	return videos
}