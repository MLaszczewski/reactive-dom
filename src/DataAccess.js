var Observable = require("./Observable.js")

class DataAccess {
  constructor(stateless, cacheData, sessionId) {
    this.sources = new Map()
    this.cache = new Map(cacheData)
    this.observations = new Map()
    this.stateless = stateless
    this.sessionId = sessionId
  }

  registerSource(name, dataSource) {
    this.sources.set(name, dataSource)
  }

  observable(sourceName, path) {
    var source = this.sources.get(sourceName)
    var cacheKey = JSON.stringify([sourceName, path])
    if(this.stateless) {
      if(this.cache.has(cacheKey)) return this.cache.get(cacheKey)
      var promise = source.get(path)
      promise.then(
        value => this.cache.set(cacheKey, value)
      )
      return promise
    } else {
      if(this.observations.has(cacheKey)) return this.observations.get(cacheKey)
      var observable = source.observable(path)
      //console.log("CACHE TEST",cacheKey,this.cache,this.cache.has(cacheKey))
      if(this.cache.has(cacheKey)) {
        var cachedObservable = new Observable()
        var observer = (newValue) => {
          cachedObservable.update(newValue)
          this.observations.set(cacheKey, observable)
        }
        observable.observe(observer)
        cachedObservable.update(this.cache.get(cacheKey))
        //console.log("CACHE HAS",cacheKey)
        //cachedObservable.observe(d => console.log("CACHE RES",d))
        this.observations.set(cacheKey, cachedObservable)
        return cachedObservable
      } else {
        this.observations.set(cacheKey, observable)
        return observable
      }
    }
  }
  
  cacheData() {
    return Array.from(this.cache.entries())
  }

  dispose() {
    for(let source of this.sources.values()) {
      source.dispose()
    }
  }

  request(sourceName, path, ...args) {
    var source = this.sources.get(sourceName)
    return source.request(path, ...args)
  }
  event(sourceName, path, ...args) {
    var source = this.sources.get(sourceName)
    source.event(path, ...args)
  }

}

module.exports = DataAccess
