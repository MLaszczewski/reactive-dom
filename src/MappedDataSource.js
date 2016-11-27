var Observable = require("./Observable.js")

class MappedDataSource {
  constructor(dataSource, mapFunction) {
    this.dataSource = dataSource
    this.mapFunction = mapFunction
  }

  observable(name) {
    return this.dataSource.observable(this.mapFunction(name))
  }

  get(name) {
    return this.dataSource.get(this.mapFunction(name))
  }
  
  request(name, ...args) {
    return this.dataSource.request(this.mapFunction(name), ...args)
  }

  dispose() {
  }
}

module.exports = MappedDataSource