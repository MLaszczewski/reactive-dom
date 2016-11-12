var Observable = require("./Observable.js")

class SubDataSource {
  constructor(dataSource, prefix) {
    this.dataSource = dataSource
    this.prefix = prefix
  }

  observable(name) {
    return this.dataSource.observable(this.prefix.concat(name))
  }

  get(name) {
    return this.dataSource.get(this.prefix.concat(name))
  }

  dispose() {
  }
}

module.exports = SubDataSource