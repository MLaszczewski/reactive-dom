
class Observable {
  constructor(value) {
    this.value = value
    this.observers = []
  }
  observe(observer) {
    this.observers.push(observer)
    if(typeof this.value != 'undefined') observer(this.value)
  }
  unobserve(observer) {
    this.observers.splice(this.observers.indexOf(observer), 1)
  }
  update(value) {
    if(value === this.value) return;
    try {
      if (JSON.stringify(value) == JSON.stringify(this.value)) return;
    } catch(e) {}
    let oldValue = this.value
    this.value = value
    this.observers.forEach(observer => observer(value, oldValue))
  }
}

module.exports = Observable
