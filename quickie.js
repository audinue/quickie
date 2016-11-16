Array.prototype.forEach = function (callback) {
  for (let i = 0, length = this.length; i < length; i++) {
    callback(this[i], i)
  }
}
let root
const canvas = document.createElement('canvas')
canvas.x = 0
canvas.y = 0
canvas.width = 600
canvas.height = 400
const context = canvas.getContext('2d')
if (!document.body) {
  document.documentElement.appendChild(document.createElement('body'))
}
document.body.appendChild(canvas)
let fps = 60
let previous = performance.now()
function nextFrame (now) {
  requestAnimationFrame(nextFrame)
  const delta = now - previous
  const interval = 1000 / fps
  if (delta > interval) {
    previous = now - (delta % interval)
    if (typeof update == 'function') {
      update()
    }
    if (root) {
      root.update()
    }
  }
}
window.addEventListener('load', () => {
  requestAnimationFrame(nextFrame)
  focus()
})
function random (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function randomColor () {
  return 'rgb(' + random(0, 255) + ', ' + random(0, 255) + ', ' + random(0, 255) + ')'
}
function shuffle (array) {
  const copy = array.slice(0)
  const shuffled = []
  while (copy.length) {
    const index = random(0, copy.length - 1)
    shuffled.push(copy[index])
    copy.splice(index, 1)
  }
  return shuffled
}
function measureText (text) {
  const width = context.measureText(text).width
  const span = document.createElement('span')
  span.style.font = context.font
  document.body.appendChild(span)
  const height = span.offsetHeight
  document.body.removeChild(span)
  return { width, height }
}
function hitTestPoint (point, rectangle) {
  return point.x >= rectangle.x &&
    point.x < rectangle.x + rectangle.width &&
    point.y >= rectangle.y &&
    point.y < rectangle.y + rectangle.height
}
function hitTestRect (a, b) {
  return a.x <= b.x + b.width &&
    b.x <= a.x + a.width &&
    a.y <= b.y + b.height &&
    b.y <= a.y + a.height
}
class EventEmitter {
  constructor () {
    this.listeners = {}
  }
  on (type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(callback)
    return this
  }
  off (type, callback) {
    if (this.listeners[type]) {
      const index = this.listeners[type].indexOf(callback)
      if (index > -1) {
        this.listeners[type].splice(index, 1)
      }
    }
    return this
  }
  emit (type, ...args) {
    if (this.listeners[type]) {
      this.listeners[type]
        .slice(0)
        .forEach(callback => callback(...args))
    }
    return this
  }
}
const mouse = Object.assign(new EventEmitter(), {
  x: 0,
  y: 0,
  isDown: false,
})
canvas.addEventListener('mousedown', (e) => {
  mouse.x = e.offsetX
  mouse.y = e.offsetY
  mouse.isDown = true
  mouse.emit('down', mouse.x, mouse.y)
})
document.addEventListener('mousemove', (e) => {
  mouse.x = e.offsetX
  mouse.y = e.offsetY
  mouse.emit('move', mouse.x, mouse.y)
})
document.addEventListener('mouseup', (e) => {
  mouse.x = e.offsetX
  mouse.y = e.offsetY
  mouse.isDown = false
  mouse.emit('up', mouse.x, mouse.y)
})
const key = Object.assign(new EventEmitter(), {
  map: {},
  isDown (keyCode) {
      return this.map[keyCode]
  },
  disabled: [],
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  ESCAPE: 27,
  ENTER: 13,
})
for (let i in key) {
  if (typeof key[i] === 'number') {
    key.disabled.push(key[i])
  }
}
document.addEventListener('keydown', (e) => {
  key.map[e.keyCode] = true
  key.emit('down', e.keyCode)
  if (key.disabled.indexOf(e.keyCode) > -1) {
    e.preventDefault()
  }
})
document.addEventListener('keyup', (e) => {
  key.map[e.keyCode] = false
  key.emit('up', e.keyCode)
})
function align (source, target, horizontal = 'center', vertical = 'middle') {
  switch (horizontal) {
    case 'left':
      source.x = 0
      break
    case 'center':
      source.x = target.width / 2 - source.width / 2
      break
    case 'right':
      source.x = target.width - source.width
      break
  }
  switch (vertical) {
    case 'top':
      source.y = 0
      break
    case 'middle':
      source.y = target.height / 2 - source.height / 2
      break
    case 'bottom':
      source.y = target.height - source.height
      break
  }
}
function createAlignable (options) {
  return Object.assign({
    alignTo (target, horizontal = 'center', vertical = 'middle') {
      align(this, target, horizontal, vertical)
      return this
    }
  }, options)
}
function createNode (...options) {
  options = Object.assign({
    children: [],
    add (child) {
      this.children.push(child)
      return this
    },
    remove (child) {
      const index = this.children.indexOf(child)
      if (index > -1) {
        this.children.splice(index, 1)
      }
      return this
    },
    onInitialize () {},
    onUpdate () {},
    update () {
      this.children
        .slice(0)
        .forEach(child => child.update())
      this.onUpdate()
    }
  }, ...options)
  options.onInitialize()
  return options
}
function createBackground (color = '#000') {
  return {
    color,
    update () {
      context.fillStyle = this.color
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }
}
function createTextBox (options) {
  if (typeof options === 'string') {
    options = { text: options }
  }
  return Object.assign({
    textValue: '',
    get text () {
      return this.textValue
    },
    set text (value) {
      this.textValue = value
      context.font = this.font
      Object.assign(this, measureText(value))
      this.width += this.padding * 2
      this.height += this.padding * 2
    },
    x: 0,
    y: 0,
    color: '#ccc',
    font: '11pt arial',
    background: '#111',
    border: '#ccc',
    padding: 10,
    update () {
      context.fillStyle = this.background
      context.fillRect(this.x, this.y, this.width, this.height)
      context.fillStyle = this.color
      context.font = this.font
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2)
      context.strokeStyle = this.border
      context.strokeRect(this.x, this.y, this.width, this.height)
    }
  }, {
    text: 'Hello world!'
  }, createAlignable(), options)
}