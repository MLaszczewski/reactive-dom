var RawComponent = require("./RawComponent.js")
//var Element = require("./Element.js")

class Component extends RawComponent {
  
  constructor(settings) {
    super()
    this.parent = null
    this.ready = false
    this.elements = []
    this.element = null
    this.settings = settings || {}
    this.initializedChildren = []
  }
  
  template() {
    throw new Error("Component template method must be implemented in " + this.constructor)
  }
  
  initializeDom(parent) {
    this.templateElement = this.template()
    if(this.settings.expand) {
      this.templateElement.initializeDom(this)
      var elementArrays = this.templateElement.initializedChildren.map(
        child => child.elements
      )
      this.elements = Array.prototype.concat.apply([],elementArrays)
    } else {
      this.templateElement.initializeDom(this)
      this.elements = [this.templateElement.element]
    }
    this.element = this.elements[0]
    this.parent = parent
    this.ready = true
    this.domReady()
  }

  domReady() {}

  afterDisplay() {}

  display() {
    this.templateElement.display()
    this.afterDisplay()
  }

  handleChildUpdate(child, removedElements, addedElements) {
    if(child != this.templateElement) throw new Error("Unknown child update")
    if(this.settings.expand) {
      this.elements = child.elements
      if(this.parent) {
        this.parent.handleChildUpdate(child, removedElements, addedElements)
      } 
    } else {
      // only on dispose, no action needed
    }
  }

  renderHtmlOutputList() {
    if(this.settings.expand) {
      return this.template().children.map(
        child => child.renderHtmlOutputList()
      )
    } else {
      return this.template().renderHtmlOutputList()
    }
  }
  
  dispose() {
    this.templateElement.dispose()
    if(this.parent && !this.settings.expand) this.parent.handleChildUpdate(this, this.elements, [])
  }
  
}

module.exports = Component