var ReactiveDOM = require('../index.js')

describe('simple', () => {
  var template, title
  before(() => {
    title = ReactiveDOM.observable("title1")
    template =
      <div class="main">
        <h1>{ title }</h1>
      </div>
    template.initializeDOM(null)
  })
  it('generate dom', () => {
    assert(template.element.outerHTML=='<div class="main"><h1>title1</h1></div>')
  })
  it('update dom', () => {
    title.update("title2")
    assert(template.element.outerHTML=='<div class="main"><h1>title2</h1></div>')
  })
});