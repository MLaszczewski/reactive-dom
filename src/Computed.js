var Observable = require("./Observable.js")

class Computed extends Observable {
  
  constructor(compute) {
    super()

    this.value = undefined
    this.compute = compute
    this.values = new Map()
    this.valueObservers = new Map()
    this.promiseReaders = new Map()
    this.nextSources = new Map()

    this.getFunction = (what) => {
      if(this.values.has(what)) {
        this.nextSources.set(what,true)
        return this.values.get(what)
      }
      if(what.observe) {
        return this.observeValue(what)
      } else 
      if(what.then) {
        return this.readPromise(what)
      } else return what
    }
  }

  readPromise(what) {
    if(this.promiseReaders.has(what)) return undefined
    var reader = (newValue) => {
      this.values.set(what,newValue)
      this.recompute()
    }
    this.promiseReaders.set(what,reader)
    return undefined
  }

  observeValue(what) {
    this.nextSources.set(what,true)
    var observer = this.valueObservers.get(what)
    if(observer) return what.value
    this.values.set(what, what.value)
    observer = (newValue) => {
      var oldValue = this.values.get(what)
      //console.log("VV",oldValue,'=>',newValue)
      if(newValue !== oldValue) {
        this.values.set(what, newValue)
        if(out) this.recompute()
      }
    }
    var out = false // block inside recompute
    what.observe(observer)
    out = true
    this.valueObservers.set(what, observer)
    return what.value
  }

  recompute() {
    this.nextSources.clear()
    var newValue = this.compute(this.getFunction)
    for(let [what, observer] of this.valueObservers) {
      if(!this.nextSources.has(what)) {
        what.unobserve(observer)
        this.valueObservers.delete(what)
        this.values.delete(what)
      }
    }
   // console.log("RECOMPUTED", newValue)
    this.update(newValue)
  }

  observe(observer) {
    this.observers.push(observer)
    if(this.observers.length == 1) {
      this.handleObserved()
    } else {
      observer(this.value)
    }
  }
  unobserve(observer) {
    this.observers.splice(this.observers.indexOf(observer), 1)
    if(this.observers.length == 0) this.handleUnobserved()
  }

  handleObserved() {
   // console.log("HANDLE OBSERVED",this.compute, this.observers.length)
    this.recompute()
  }
  handleUnobserved() {
    this.values.clear()
    for(let [what, observer] of this.valueObservers.entries()) {
      what.unobserve(observer)
    }
  }
}

module.exports = Computed


