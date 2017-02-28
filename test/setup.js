const elementaryMML = require('../lib/main.js');
const jsdom = require('jsdom').jsdom;

exports.test = function(input){
  let doc = jsdom(input);
  let window = doc.defaultView;
  document = window.document;
  window.elementaryMML =  elementaryMML.elementaryMML;
  let mathNodes = window.document.getElementsByTagName('math');
  window.elementaryMML.transformElements(mathNodes);
  return window.document.body.firstChild.outerHTML;
}
