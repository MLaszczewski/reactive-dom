var RawComponent = require("./RawComponent.js")
//var Element = require("./Element.js")

class Component extends RawComponent {
  
  constructor(settings) {
    super()
    this.parent = null
    this.ready = false
    this.elements = []
    this.settings = settings || {}
    this.initializedChildren = []
  }
  
  template() {
    throw new Error("Component template method must be implemented in " + this.constructor)
  }
  
  initializeDom(parent) {
    this.parent = parent
    this.templateElement = this.template()
    if(this.settings.expand) {
      this.templateElement.initializeDom(this)
      this.initializedChildren = this.templateElement.initializedChildren
      for(var child of this.initializedChildren) {
        if(child.parent === this.templateElement) {
      //    console.log("CHANGE PARENT OF",child.elements[0].outerHTML,"TO",this.constructor.name)
          child.parent = this
        }
      }
    } else {
      this.templateElement.initializeDom(this)
      this.initializedChildren = [this.templateElement]
    }
    this.elements = Array.prototype.concat.apply([],this.initializedChildren.map(child => child.elements))
    //console.log("COMPONENT",this.constructor.name,"ELEMENT",this.element.outerHTML)
    //this.parent = parent
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
    if(this.settings.expand) {
    //  console.log("HANDLE CHILD UPDATE",child,removedElements)
      //this.elements = child.elements
      if(this.parent) {
       // console.log("CHILD UPDATE PARENT HTML",this.parent.outerHTML)
        this.parent.handleChildUpdate(child, removedElements, addedElements)
      } 
    } else {
      if(child != this.templateElement) throw new Error("Unknown child update")
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
   // console.log("DISPOSE COMPONENT",this.constructor.name,"IN",this.parent.elements[0].outerHTML)
    if(!this.settings.expand) {
      this.templateElement.dispose()
    } else {
      for(var element of this.templateElement.initializedChildren) element.dispose();
    }
    if(this.parent && !this.settings.expand) this.parent.handleChildUpdate(this, this.elements, [])
  }
  
}

module.exports = Component