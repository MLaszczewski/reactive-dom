var RawComponent = require("./RawComponent.js")

var voidElements = ['area','base','br','col','embed','hr','img','input','keygen','link','menuitem','meta','param',
  'source','track','wbr']

class TextNode {
  constructor(text) {
    this.text = text
  }
  initializeDom(parent) {
    this.parent = parent
    this.elements = [document.createTextNode(this.text)]
  }
  dispose() {
    this.parent.handleChildUpdate(this,this.elements,[])
  }
  display() {}
}

class ElementsObservable {
  constructor(observable) {
    this.observable = observable
    this.elements = []
    this.child = null
    this.parent = null
    this.finished = false
    this.observer = (value) => {
      //console.log("ElementsObservable v =",value)
      if(this.finished) return;
      if(this.child) this.child.dispose()
      this.child = initializeChild(value)
      if(this.parent && this.child) { // Update Dom!
        this.child.initializeDom(this)
        this.parent.handleChildUpdate(this, [/* elements removed in dispose all */], this.child.elements)
        this.child.display()
      }
    }
    if(this.observable.observe) this.observable.observe(this.observer)
    if(this.observable.then) this.observable.then(this.observer)
  }

  initializeDom(parent) {
    this.parent = parent
    if(!this.child) {
      this.elements = []
      return
    }
    
    this.child.initializeDom(this)
    this.elements = this.child.elements
  }

  display() {
    if(this.child) this.child.display()
  }

  dispose() {
    if(this.observable.unobserve) this.observable.unobserve(this.observer)
    if(this.child) this.child.dispose()
    this.finished = true
  }

  handleChildUpdate(child, removedElements, addedElements) {
    if(child != this.child) throw new Error("Update from disposed child")
    if(!this.parent) throw new Error("update before Dom init")
    this.parent.handleChildUpdate(this, removedElements, addedElements)
  }
}

class ElementsArray {
  constructor(elements) {
    this.sourceElements = elements.map(element => initializeChild(element) )
    this.elements = []
    this.parent = null
    this.finished = false
    this.initializedElements = []
  }

  initializeDom(parent) {
    this.parent = parent
    this.sourceElements.forEach(element => element.initializeDom(this))
    this.elements = this.sourceElements.reduce((arr,element) => {
      return arr.concat(element.elements)
    },[])
  }

  display() {
    this.initializedElements.forEach(element => element.display())
  }

  dispose() {
    this.initializedElements.forEach(element => element.dispose())
    this.finished = true
  }

  handleChildUpdate(child, removedElements, addedElements) {
    if(child != this.child) throw new Error("Update from disposed child")
    if(!this.parent) throw new Error("update before Dom init")
    this.parent.handleChildUpdate(this, removedElements, addedElements)
  }
}

function initializeChild(child) {
  if(child instanceof Element) {
    return child
  } else if(typeof child == 'object') {
    if (child instanceof Array) {
      return new ElementsArray(child)
    } else if(child instanceof RawComponent) {
      return child
    } else if(child.observe || child.then) {
      return new ElementsObservable(child)
    }
    throw new Error("Unknown child type: "+child)
  } else {
    return new TextNode(child)
  }
}

function canBeSelfClosed(tagName) {
  if(voidElements.indexOf(tagName)!=-1) return true;
  return false
}

function renderChildHtmlOutputList(child) {
  if(typeof child == 'object') {
    if(child instanceof Array) {
      return child.map(renderChildHtmlOutputList)
    } else if(child === undefined || child === null) {
      return child
    } else if(child.then) {
      return child.then(value => renderChildHtmlOutputList(value))
    } else if(child.renderHtmlOutputList) {
      return child.renderHtmlOutputList()
    }
    console.error("Unknown child:",child)
    throw new Error("Unknown child type: "+child)
  } else {
    return ""+child
  }
}

class Element {

  constructor(tagName, attributes, ...children) {
    this.tagName = tagName
    this.attributes = attributes
    this.children = children
    this.initializedChildren = null
    this.parent = null
    this.element = null
  }

  initializeDom(parent) {
    this.parent = parent
    this.element = document.createElement(this.tagName)
    if(this.attributes) {
      var setAttribute = (name,value) => {
        if(name == 'innerHTML') {
          this.element.innerHTML = value
        } else if(name.slice(0,2)=='on') {
          //var eventName = name.slice(2)
          //this.element.addEventListener(eventName,value)
          this.element[name]=value
        } else {
          if(!value) return this.element.removeAttribute(name)
          this.element.setAttribute(name,"" + value)
        }
      }
      Object.keys(this.attributes).forEach((attributeName) => {
        var attributeValue = this.attributes[attributeName]
        if (attributeValue === undefined) return;
        if (attributeValue === null) return;
        if (typeof attributeValue !== 'object') {
          setAttribute(attributeName, attributeValue)
        }
        if (attributeValue.observe) {
          attributeValue.observe(value => setAttribute(attributeName, value))
        }
        if (attributeValue.then) {
          attributeValue.then(value => setAttribute(attributeName, value))
        }
      })

    }

    this.initializedChildren = this.children.map(initializeChild)
    for(let child of this.initializedChildren) {
      child.initializeDom(this)
      child.elements.forEach(element => this.element.appendChild(element))
    }
    
   // console.log("ELEMENT",this.element)
    this.elements = [this.element]

  }
  
  handleChildUpdate(child, removedElements, addedElements) {
    for(let element of removedElements) this.element.removeChild(element)
    let childIndex = this.initializedChildren.indexOf(child)
    let nextChildIndex = childIndex + 1
    let nextChild = this.initializedChildren[nextChildIndex]
    while(nextChild && nextChild.elements.length==0) nextChild = this.initializedChildren[++nextChildIndex]
    for(let element of addedElements) {
      if(nextChild) {
        this.element.insertBefore(element,nextChild.elements[0])
      } else {
        this.element.appendChild(element)
      }
    }
  }
  
  renderHtmlOutputList() {
    var attributes = this.attributes && Object.keys(this.attributes).map(
      attributeName => {
        if(attributeName.slice(0,2)=='on') return [];
        var attributeValue = this.attributes[attributeName]
        if(attributeName=='innerHTML') return [];
        if((typeof attributeValue == 'object') && attributeValue.then) {
          return attributeValue.then(value => {
            return [" ",attributeName, '="', value, '"']
          })
        } else {
          return [" ",attributeName, '="', attributeValue, '"']
        }
      }
    )
    var children = this.children.map(renderChildHtmlOutputList)
    if(this.attributes && this.attributes.innerHTML) return [
      "<", this.tagName, attributes ? attributes : "", ">",
      this.attributes.innerHTML,
      "</", this.tagName, ">"
    ]
    return (children && children.length > 0 || !canBeSelfClosed(this.tagName)) ? [
      "<", this.tagName, attributes ? attributes : "", ">",
        children,
      "</", this.tagName, ">"
    ] : [
      "<", this.tagName, attributes ? attributes : "", " />",
    ]
  }

  display() {
    this.initializedChildren.forEach(
      child => child.display()
    )
  }

  dispose() {
    this.initializedChildren.forEach(child => child.dispose())
    if(this.parent) this.parent.handleChildUpdate(this, this.elements, [])
  }


}
Element.renderHtmlOutputList = renderChildHtmlOutputList

module.exports = Element
