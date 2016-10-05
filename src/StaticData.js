var Observable = require("./Observable.js")

class StaticData {
  constructor(data) {
    this.data = data
  }
  
  observable(name) {
    var data = this.data[name]
    if(data.observe) return data
    if(data.then) return data
    return Observable(data)
  }
  
  get(name) {
    var data = this.data[name]
    if(data.then) return data
    return new Promise(
      (resolve, reject) => resolve(data)
    )
  }

  dispose() {
    
  }
}

module.exports = StaticData