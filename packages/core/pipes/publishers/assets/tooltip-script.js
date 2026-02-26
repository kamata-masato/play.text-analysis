;(() => {
  const tooltip = document.createElement('div')
  tooltip.className = 'glossa-tooltip'
  document.body.appendChild(tooltip)

  let timeout = null

  const cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  const schedule = () => {
    cancel()
    timeout = setTimeout(() => {
      tooltip.style.display = 'none'
    }, 200)
  }

  document.addEventListener(
    'mouseenter',
    (event) => {
      const element = event.target

      if (!element.classList || !element.classList.contains('glossa')) return

      const key = element.getAttribute('data-glossa-concept')

      if (!key || !window.__GLOSSA_CONCEPTS__ || !window.__GLOSSA_CONCEPTS__[key]) return

      cancel()

      const concept = window.__GLOSSA_CONCEPTS__[key]

      tooltip.textContent = ''

      const name = document.createElement('div')
      name.className = 'glossa-tooltip-name'
      name.textContent = key
      tooltip.appendChild(name)

      const description = document.createElement('div')
      description.className = 'glossa-tooltip-description'
      description.textContent = concept.description
      tooltip.appendChild(description)

      if (concept.links && concept.links.length > 0) {
        const links = document.createElement('div')
        links.className = 'glossa-tooltip-links'
        for (let i = 0; i < concept.links.length; i++) {
          const link = document.createElement('a')
          link.textContent = concept.links[i].label

          if (concept.links[i].href && concept.links[i].href.indexOf('javascript:') !== 0) {
            link.href = concept.links[i].href
          }

          links.appendChild(link)
        }

        tooltip.appendChild(links)
      }

      const rectangle = element.getBoundingClientRect()

      tooltip.style.left = '0px'
      tooltip.style.top = '0px'
      tooltip.style.display = 'block'

      const width = tooltip.offsetWidth
      const height = tooltip.offsetHeight

      let top = rectangle.bottom + 8
      if (top + height > window.innerHeight) {
        top = rectangle.top - height - 8
      }
      if (top < 0) {
        top = 0
      }

      let left = rectangle.left
      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 16
      }
      if (left < 0) {
        left = 0
      }

      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
    },
    true,
  )

  document.addEventListener(
    'mouseleave',
    (event) => {
      const element = event.target

      if (!element.classList || !element.classList.contains('glossa')) return

      schedule()
    },
    true,
  )
  tooltip.addEventListener('mouseenter', cancel)
  tooltip.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none'
  })
})()
