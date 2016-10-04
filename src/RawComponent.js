
class RawComponent {
  
  constructor() {
    this.parent = null
    this.elements = []
  }
  
  initializeDom(parent) {
    this.parent = parent
  }

  display() {}
  
  dispose() {
    if(this.parent) this.parent.handleChildUpdate(this, this.elements, [])
  }
  
}

module.exports = RawComponent