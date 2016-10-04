// var Promise = require('es6-promises')

var flatten = function(outputList, timeout) {
  if(timeout && Date.now() > timeout) return new Promise((r,j) => j("timeout"))
  
  if(typeof outputList == "string" || outputList === null || outputList === undefined) return new Promise((r,j) => r(outputList))
  if(typeof outputList == "number") return new Promise((r,j) => r(""+outputList))
  
  if(timeout) {
    var timeRemaining = () => timeout - Date.now()
  }
  
  if(outputList.then) 
    return outputList.then(resolved => flatten(resolved, timeout))
  
  if(outputList instanceof Array)
    return new Promise((resolve, reject) => {
      var promiseList = outputList.map(element => {
          if (typeof element == 'object') {
            if(element instanceof Array) return flatten(element, timeout)
            if(element.then) return element
            throw new Error("Unknown element in Output List: "+element)
          } else {
            return element
          }
        }
      )
      var promiseCount = 0
      promiseList.forEach(element => {
        if(element.then) {
          promiseCount ++
        }
      })
      var fulfilledCount = 0
      var checkIfDone = () => {
        if(fulfilledCount == promiseCount) {
          resolve(promiseList.join(''))
          return true
        }
        return false
      } 
      if(checkIfDone()) return;
      var error = false
      var resolveElement = i=>promiseList[i].then(
        resolved => {
          if(error) return;
          if(typeof resolved == 'string' || typeof resolved == 'number') {
            promiseList[i] = resolved
            fulfilledCount++
            checkIfDone()
          } else {
            if(resolved.then) {
              promiseList[i] = resolved
              resolveElement(i)
            } else {
              promiseList[i] = flatten(resolved, timeout)
              resolveElement(i)
            }
          }
        },
        rejected => {
          if(error) return;
          error = true
          reject(rejected)
        }
      )
      for(var i=0; i<promiseList.length; i++) {
        var element = promiseList[i]
        if(element.then) resolveElement(i)
      }
      
      if(timeout) setTimeout(() => {
        if(error) return;
        if(fulfilledCount < promiseCount) {
          error = true
          reject('timeout')
        }
      }, timeRemaining())
    })

}


exports.flatten = flatten