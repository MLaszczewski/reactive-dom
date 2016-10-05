var Element = require("./Element.js")
var Observable = require("./Observable.js")
var Computed = require("./Computed.js")
var outputList = require("./outputList.js")
var RawComponent = require("./RawComponent.js")
var Component = require("./Component.js")
var DataAccess = require("./DataAccess.js")
var StaticData = require("./StaticData.js")
var Router = require("./Router.js")

var settings = {
  stateless: (typeof window === 'undefined')
}

exports.settings = settings

function createElement(tagName, attributes, ...children) {
  if(typeof tagName == 'string') return new Element(tagName, attributes, ...children)
  if(typeof tagName == 'function') return new (tagName)(attributes, ...children)
  throw new Error("Unknown elementy "+tagName)
}
exports.createElement = createElement

function extendPromise(promise) {
  promise.set = () => {} // silence accidential set calls
  promise.extend = () => promise // ignore extenders
}

function observable(value) {
  if(settings.stateless) {
    var promise = new Promise((resolve,reject) => {
      resolve(value)
    })
    extendPromise(promise)
    return promise
  } else {
    return new Observable(value)
  }
}
exports.observable = observable

function computed(compute) {
  if(settings.stateless) {
    return new Promise((resolve,reject) => {
      var values = new Map()
      var waitingPromises = new Map()
      var error = null
      const recompute = () => {
        var result = compute((what) => {
          if(!what.then) return what
          if(values.has(what)) {
            return values.get(what)
          }
          if(waitingPromises.has(what)) return undefined // wait more
          waitingPromises.set(what,true)
          what.then(
            resolved => {
              values.set(what, resolved)
              waitingPromises.delete(what)
              recompute()
            },
            rejected => {
              if(!error) {
                error = rejected
                reject(error)
              }
            }
          )
        })
        if(waitingPromises.size == 0 && !error) resolve(result)
      }
      recompute()
    })
  } else {
    return new Computed(compute)
  }
}

var createDAO = function(initialState, sessionId) {
  return new DataAccess(settings.stateless, initialState, sessionId)
}

var prepareData = function(data) {
  return new StaticData(data)
}

exports.computed = computed
exports.renderHtmlOutputList = Element.renderHtmlOutputList
exports.flattenOutputList = outputList.flatten
exports.createDAO = createDAO
exports.prepareData = prepareData
exports.Component = Component
exports.RawComponent = RawComponent
exports.StaticData = StaticData
exports.Observable = Observable
exports.Computed = Computed
exports.Router = Router
