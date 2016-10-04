var Observable = require("./Observable.js")

class StaticData {
  constructor(data) {
    this.data = data
  }
  
  observable(name) {
    return Observable(this.data[name])
  }
  
  get(name) {
    return new Promise(
      (resolve, reject) => resolve(this.data[name])
    )
  }
}

module.exports = StaticData