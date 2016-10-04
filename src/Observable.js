
class Observable {
  constructor(value) {
    this.value = value
    this.observers = []
  }
  observe(observer) {
    this.observers.push(observer)
    observer(this.value)
  }
  unobserve(observer) {
    this.observers.splice(this.observers.indexOf(observer), 1)
  }
  update(value) {
    if(value === this.value) return;
    let oldValue = this.value
    this.value = value
    this.observers.forEach(observer => observer(value, oldValue))
  }
}

module.exports = Observable
