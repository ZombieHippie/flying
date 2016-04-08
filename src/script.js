
/* Example definition of a simple mode that understands a subset of
 * JavaScript:
 */
var cm = CodeMirror.fromTextArea(document.getElementById("code"), { mode: "javascript", styleSelectedText: true, showCursorWhenSelecting: true })

var worker = null

cm.on('change', (event) => {
  console.log(event)
  var text = event.getDoc().getValue()
  if (worker) {
    worker.terminate();
    worker = null;
  }
  updateText(text)
})


var out = document.getElementById("code-render-out")

function renderText(text) {
  out.innerHTML = text.replace(/\n$/, '\n\n')  
}
var worker_start = `self.addEventListener('message', function(e) {`
var worker_end = `}, false);
var window = {};
window.alert = function(){
  console.log.apply(console, ["Alert: "].concat(Array.prototype.slice.call(arguments)));
};
function __post (event, data) {
  self.postMessage(JSON.stringify({event:event,data:data}))
}

var alert = window.alert;
var console = {
  log: function(){
    __post('console.log', Array.prototype.slice.call(arguments));
  },
  error: function(){
    __post('console.error', Array.prototype.slice.call(arguments));
  },
  warn: function(){
    __post('console.warn', Array.prototype.slice.call(arguments));
  }
};
function wait(id, ms){
  if(typeof ms !== 'number') ms = 400;
  __ee.emit("wait")
  __post('update-wait',{ id: id, ms: ms })
  var d = Date.now() + ms
  while(d > Date.now()) {}
}

// github.com/isaacs/json-stringify-safe
function stringify(a,b,c,d){return JSON.stringify(a,serializer(b,d),c)}function serializer(a,b){var c=[],d=[];return null==b&&(b=function(a,b){return c[0]===b?"[Circular ~]":"[Circular ~."+d.slice(0,c.indexOf(b)).join(".")+"]"}),function(e,f){if(c.length>0){var g=c.indexOf(this);~g?c.splice(g+1):c.push(this),~g?d.splice(g,1/0,e):d.push(e),~c.indexOf(f)&&(f=b.call(this,e,f))}else c.push(f);return null==a?f:a.call(this,e,f)}}

/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */
(function(){"use strict";function t(){}function i(t,n){for(var e=t.length;e--;)if(t[e].listener===n)return e;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var e=t.prototype,r=this,s=r.EventEmitter;e.getListeners=function(n){var r,e,t=this._getEvents();if(n instanceof RegExp){r={};for(e in t)t.hasOwnProperty(e)&&n.test(e)&&(r[e]=t[e])}else r=t[n]||(t[n]=[]);return r},e.flattenListeners=function(t){var e,n=[];for(e=0;e<t.length;e+=1)n.push(t[e].listener);return n},e.getListenersAsObject=function(n){var e,t=this.getListeners(n);return t instanceof Array&&(e={},e[n]=t),e||t},e.addListener=function(r,e){var t,n=this.getListenersAsObject(r),s="object"==typeof e;for(t in n)n.hasOwnProperty(t)&&-1===i(n[t],e)&&n[t].push(s?e:{listener:e,once:!1});return this},e.on=n("addListener"),e.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},e.once=n("addOnceListener"),e.defineEvent=function(e){return this.getListeners(e),this},e.defineEvents=function(t){for(var e=0;e<t.length;e+=1)this.defineEvent(t[e]);return this},e.removeListener=function(r,s){var n,e,t=this.getListenersAsObject(r);for(e in t)t.hasOwnProperty(e)&&(n=i(t[e],s),-1!==n&&t[e].splice(n,1));return this},e.off=n("removeListener"),e.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},e.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},e.manipulateListeners=function(r,t,i){var e,n,s=r?this.removeListener:this.addListener,o=r?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(e=i.length;e--;)s.call(this,t,i[e]);else for(e in t)t.hasOwnProperty(e)&&(n=t[e])&&("function"==typeof n?s.call(this,e,n):o.call(this,e,n));return this},e.removeEvent=function(e){var t,r=typeof e,n=this._getEvents();if("string"===r)delete n[e];else if(e instanceof RegExp)for(t in n)n.hasOwnProperty(t)&&e.test(t)&&delete n[t];else delete this._events;return this},e.removeAllListeners=n("removeEvent"),e.emitEvent=function(t,u){var n,e,r,i,o,s=this.getListenersAsObject(t);for(i in s)if(s.hasOwnProperty(i))for(n=s[i].slice(0),r=n.length;r--;)e=n[r],e.once===!0&&this.removeListener(t,e.listener),o=e.listener.apply(this,u||[]),o===this._getOnceReturnValue()&&this.removeListener(t,e.listener);return this},e.trigger=n("emitEvent"),e.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},e.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},e._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},e._getEvents=function(){return this._events||(this._events={})},t.noConflict=function(){return r.EventEmitter=s,t},"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:r.EventEmitter=t}).call(this);

__data = {}
__chkd = {}
__ee = new EventEmitter();

`
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
function escapeRE (str) {
  if (typeof str !== 'string') { throw new TypeError('Expected a string'); }
  return  str.replace(matchOperatorsRe, '\\$&');
}

function runText(text, ee) {
  // Prepare the javascript String,
  // by adding the parts before and after the user code.
  var code = worker_start + text + worker_end;
  // This is basically the previous code block in string form

  // prepare the string into an executable blob
  var bb = new Blob([code], {
    type: 'text/javascript'
  });

  // convert the blob into a pseudo URL
  var bbURL = URL.createObjectURL(bb);

  // Prepare the worker to run the code
  worker = new Worker(bbURL);

  var haslogged = false
  // add a listener for messages from the Worker
  worker.addEventListener('message', function(e){
    var evt = JSON.parse((e.data).toString())
    ee.emit(evt.event, evt.data)
  }.bind(this));

  ee.on('console.log', logEvent)
  ee.on('console.warn', warnEvent)
  ee.on('console.error', errorEvent)
  ee.on('log', console.log.bind(console))

  function logEvent (args) { out('log', args) }
  function warnEvent (args) { out('warn', args) }
  function errorEvent (args) { out('error', args) }
  function out (className, data) {
    var string = ''
    for (var i = 0; i < data.length; i++) {
      string += JSON.stringify(data[i],null,2) + (i > 0 ? ' ' : '')
    }
    $('#output').append((haslogged ? '\n' : '') + `<span class="${className}">${string}</span>`);
    haslogged = true
  }
  $('#output').html('')
  
  // add a listener for errors from the Worker
  worker.addEventListener('error', function(e){
    console.log('error', e)
    var string = (e.message).toString();
    $('#output').append('<span class="error"> ERROR: ' + string + '</span>\n');
  });

  // Finally, actually start the worker
  worker.postMessage('start');

  // Put a timeout on the worker to automatically kill the worker
  setTimeout(function(){
    worker.terminate();
    worker = null;
  }, 30 * 60 * 1000);
}

var bid = 0
function getUniqueId(pre) {
  pre = typeof pre === 'string' && pre.length ? pre : '_ui'
  return `${pre}${bid++}`
}
function createChecker (vn) {
  var id = getUniqueId('chk')
  var expr = `__chk("${id}", "${vn}", () => ${vn})&& `
  return { id: id, expr: expr }
}
createChecker.fn = `
function __chk(id, vn, evfn) {
  __post('log', __data)
  if (__chkd[id] == null) {
    __chkd[id] = true
    __ee.on('assign-' + vn, function () {
      __ee.once('wait', function () {
        var v = evfn()
        if (__data[id] !== v) {
          __data[id] = v;
          __post("update-assign", {id: id, v: v});
        }
      })
    })
  }
  __ee.emit('assign-' + vn + '-' + id)
  __ee.emit('assign-' + vn)
  return true;
}`

function annotateText (source) {
  return source
    .replace(/([\w\$]+)(\s*[^a-zA-Z_\$=]=)/g, "$1$2@={$1}")
    .replace(/([\w\$]+)(\s*[\+-])([\+-])/g, "$1+=@={$1}1")
    .replace(/\n/g, "@wait\n")
}

var executionLine = document.getElementById("execution-line")

function substituteAnotations (annotated, ee) {
  ee.on("update-assign", function (data) {
    document.querySelector(`[data-check-id=${data.id}]`).dataset.checkValue = JSON.stringify(data.v)
  })
  ee.on("update-wait", function (data) {
    var waiting = document.querySelector(`[data-wait-id=${data.id}]`)
    executionLine.style.top = waiting.offsetTop + 'px'
    executionLine.style.height = waiting.offsetHeight + 'px'
  })
  renderReplaces = []
  var js = annotated
    .replace(/@={([\w\-]+)}/g, (match, vn) => {
      var chkdata = createChecker(vn)
      renderReplaces.push({
        text: chkdata.expr,
        replace: `<span data-check-id="${chkdata.id}" data-check-value=""></span>`
      })
      return chkdata.expr
    })
    .replace(/@wait/g, (match) => {
      var uid = getUniqueId('wait')
      var expr = `;wait('${uid}')`
      renderReplaces.push({
        text: expr,
        replace: `<span data-wait-id="${uid}"></span>`
      })
      return expr
    })
  var render = js
  for (var i = 0; i < renderReplaces.length; i++) {
    render = render.replace(renderReplaces[i].text, renderReplaces[i].replace)
  }
  return {
    js: js + createChecker.fn,
    render: render
  }
}

/** Update with the most recent text and run */
function updateText(source) {
  var annotated = annotateText(source)
  var ee = new EventEmitter()
  var mod = substituteAnotations(annotated, ee)
  renderText(mod.render)
  runText(mod.js, ee)
}

updateText(cm.getDoc().getValue())
function Trial () {
  updateText(cm.getDoc().getValue())
}
window.Trial = Trial
