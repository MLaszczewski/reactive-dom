var PathDefinition = {
  define:function() {
    return Array.prototype.slice.call(arguments)
  },
  parameter:function(name,regex) {
    return {
      name:name,
      regexp:regex
    }
  },
  generate:function(defn,params) {
    // console.log("GENERATE PATH",defn,params)
    var paramsQ={}
    for(var k in params) {
      paramsQ[k]=(params[k] instanceof Array) ? params[k].slice(0) : [params[k]]
    }
    var out=''
    defn.forEach(function(part) {
      switch(typeof part) {
        case 'string':
          out+=part
          break;
        case 'object':
          if(!paramsQ[part.name] || paramsQ[part.name].length==0) throw new Error('No data for parameter with name '+part.name)
          //  console.log("PARAM",part.name,paramsQ[part.name])
          out+=paramsQ[part.name].shift()
          break;
      }
    })
    return out
  }
}

var putParamData=function(parameters,paramName,data) {
  eval('parameters.'+paramName+' = '+JSON.stringify(data))
}

var CompiledPath = function() {
  this.staticParts = {}
  this.regexpParts = {}
  this.regexps = {} // compiled regexp cache
  this.results = []
}
CompiledPath.prototype.resolve = function(path) {
  //console.log("resolve",path)
  if(path=='') return this.results.map((function(result) {
    return {result:result, parameters:{}}
  }).bind(this))
  var results=[]
  for(var i=1; i <= path.length; i++) {
    var pathPart=path.slice(0,i)
    //console.log('up',pathPart,this.staticParts,this.regexpParts)
    var staticPart=this.staticParts[pathPart]
    if(staticPart) {
      var rest=path.slice(i)
      results=results.concat(staticPart.resolve(rest))
    }
    for(var regexpId in this.regexpParts) {
      var regexp=this.regexps[regexpId]
      var regexpResult=regexp.exec(pathPart)
      if(regexpResult) {
        var rest=path.slice(regexpResult[0].length)
        var regexpPart=this.regexpParts[regexpId]
        for(var paramName in regexpPart) {
          var subres=regexpPart[paramName].resolve(rest)
          subres.forEach((function(rt) {
            rt.parameters[paramName]=regexpResult[0]
          }).bind(this))
          results=results.concat(subres)
        }
      }
    }
  }
  return results

}
CompiledPath.prototype.addCompiled = function(c) {
  for(var text in c.staticParts) {
    var compiled = c.staticParts[text]
    if(this.staticParts[text]) {
      this.staticParts[text].addCompiled(compiled)
    } else {
      this.staticParts[text] = compiled
    }
  }
  for(var text in c.regexpParts) {
    var compiledMap= c.regexpParts[text]
    if(this.regexpParts[text]) {
      for(var k in compiledMap) {
        if(this.regexpParts[text][k]) this.regexpParts[text][k].addCompiled(compiledMap[k])
        else this.regexpParts[text][k]=compiledMap[k]
      }
    } else {
      this.regexpParts[text]=compiledMap
    }
  }
  for(var text in c.regexps) {
    this.regexps[text]= c.regexps[text]
  }
  this.results=this.results.concat(c.results)
}
CompiledPath.prototype.putPath = function(definition,compiled) {
  if(definition.length==0) return this.addCompiled(compiled)
  var head=definition[0]
  var tail=definition.slice(1)
  switch(typeof head) {
    case 'string' :
      if(!this.staticParts[head]) this.staticParts[head]=new CompiledPath()
      this.staticParts[head].putPath(tail,compiled)
      return this.staticParts[head]
    case 'object' :
      if(!this.regexpParts[head.regexp]) {
        this.regexps[head.regexp]=new RegExp('^'+head.regexp, 'i')
        this.regexpParts[head.regexp]={}
      }
      if(!this.regexpParts[head.regexp][head.name]) {
        this.regexpParts[head.regexp][head.name]=new CompiledPath()
      }
      this.regexpParts[head.regexp][head.name].putPath(tail,compiled)
      return this.regexpParts[head.regexp][head.name]
  }
}
CompiledPath.prototype.print = function(indent,ac) {
  var out=""
  var mkIndent=function() {
    var s=""
    for(var i=0; i<indent; i++) s+='    '
    return s
  }
  if(ac.indexOf(this)!=-1) return mkIndent()+'FOUND CYCLIC REFERENCE\n'

  if(Object.keys(this.staticParts).length>0) {
    out+=mkIndent()+'STATIC PARTS:\n'
    for(var k in this.staticParts) {
      out+=mkIndent()+'  '+k+'\n'
      out+=this.staticParts[k].print(indent+1,ac.concat([this]))
    }
  }
  if(Object.keys(this.regexpParts).length>0) {
    out+=mkIndent()+'REGEX PARTS:\n'
    for(var k in this.regexpParts) {
      out+=mkIndent()+' '+k+'\n'
      for(var kk in this.regexpParts[k]) {
        out+=mkIndent()+'  '+kk+'\n'
        out+=this.regexpParts[k][kk].print(indent+1,ac.concat([this]))
      }
    }
  }
  if(this.results.length>0) {
    out+=mkIndent()+'RESULTS:\n'
    this.results.forEach((function(res) {
      out+=mkIndent()+'  '+res+'\n'
    }).bind(this))
  }
  return out
}

var Router = function(defn) {
  this.pathByName={}
  this.compiled=new CompiledPath()
  this.notFound=function() {}
  defn(this.addPath.bind(this),PathDefinition.parameter)
  
  //console.log("COMPILED PATH", this.compiled)
}
Router.prototype.addPath = function(name,definition,priority,action) {
  var ud={
    name: name,
    definition: definition,
    action: action,
    priority: priority
  }
  this.pathByName[name]=ud
  var c = new CompiledPath()
  c.results.push(ud)
  this.compiled.putPath(definition,c)
}
Router.prototype.generate = function(name,parameters) {
  return PathDefinition.generate(this.pathByName[name].definition,parameters)
}
Router.prototype.resolve = function(path, ...args) {
  var res=this.compiled.resolve(path)
  if(res.length==0) return this.notFound(path)
  var best=res[0]
  res.slice(1).forEach((function(r) {
    if(r.priority>best.priority) best=r
  }).bind(this))
  return best.result.action(best.parameters, ...args)
}

module.exports = Router

