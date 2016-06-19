// require('jsdom');

var elementaryMML =  {
  settings: {},
	/* Create an element with given name, belonging to the MathML namespace
	 */
	createElement: function(name) {
		return document.createElementNS('http://www.w3.org/1998/Math/MathML',name);
	},

	/* Get node's children
	 */
	getChildren: function(node) {
		var children=[];
		for(var j=0;j<node.childNodes.length; j++ ) {
			if(node.childNodes[j].nodeType==document.ELEMENT_NODE) {
				children.push(node.childNodes[j]);
			}
		}
		return children;
	},
  /* Transform the given <math> elements and replace the original elements
   */
  transformElements: function(elements){
    for (var i = 0; i< elements.length;i++){
      var mathNode = elementaryMML.transformElement(elements[i]);
      elements[i].parentNode.replaceChild(mathNode,elements[i]);
    }
  },
  /* Transform a MathML element and return the new element
	 */
	transformElement: function(element) {
		var mathNode = element.cloneNode(false);
		for(var j=0;j<element.childNodes.length; j++ ) {
			elementaryMML.transformChild(mathNode,element.childNodes[j],0);
		}
		return mathNode;
	},
  /* Transform a MathML child node into MathML node(s) and attach it/them to the parent
   */
  transformChild: function(parentNode,childNode,precedence) {
    if(!childNode) {
      var merror = elementaryMML.createElement('merror');
      elementaryMML.appendToken(merror,'mtext','Missing child node');
      parentNode.appendChild(merror);
      return;
    }
    if (childNode.nodeType==document.ELEMENT_NODE) {
      if(elementaryMML.tokens[childNode.tagName]) {
        elementaryMML.tokens[childNode.tagName](parentNode,childNode,precedence);
      // } else if (childNode.childNodes.length==0) {
      //   elementaryMML.appendToken(parentNode,'mtext',childNode.tagName);
      } else {
        var clonedChild = childNode.cloneNode(false);
        parentNode.appendChild(clonedChild);
        for(var j=0;j<childNode.childNodes.length; j++ ) {
          elementaryMML.transformChild(clonedChild,childNode.childNodes[j],precedence);
        }
      }
    } else if (childNode.nodeType==document.TEXT_NODE) {
      parentNode.appendChild(childNode.cloneNode(false));
    }
  },

	/* Add an element with given name and text content
	 */
	appendToken: function(parentNode,name,textContent) {
		var element = elementaryMML.createElement(name);
		element.textContent = textContent;
		parentNode.appendChild(element);
		return element;
	},
  tokens: {
    'mstack': function(parentNode,childNode,precedence) {
      var mtable = elementaryMML.createElement('mtable');   mtable.setAttribute('data-mml-elementary', 'mstack');
      if (childNode.getAttribute('align')){
        mtable.setAttribute('align', childNode.getAttribute('align'));
      }
      if (childNode.getAttribute('stackalign')){
        // TODO
      }
      var rowPositions = [];
      var rowLengths = [];
      var rowLines = [];
      mtable.setAttribute('columnspacing', '0');
    	var children = elementaryMML.getChildren(childNode);
    	for(var i=0;i<children.length;i++) {
        var child = children[i];
        console.log(child.tagName);
        var rowPosition = '0';
        var rowLength = '0';
        var rowLine = 'none';
        if (children[i+1]){
          if (children[i + 1].tagName === 'msline' && !children[ i + 1].getAttribute('position') && !children[ i + 1].getAttribute('length')){
            rowLine = 'solid'
          }
        }
        switch (child.tagName){
          case 'msrow':
            var mtr = elementaryMML.createElement('mtr');
            if (child.getAttribute('position')){
              rowPosition = child.getAttribute('position');
            }
            if (child.getAttribute('length')){
              rowLength = child.getAttribute('length');
            }
            elementaryMML.transformChild(mtr,child,rowPosition);
            mtable.appendChild(mtr);
            // child.parentNode.removeChild(child); // is this necessary?
            break;
          case 'msgroup':
            //
            break;
          case 'msline':
            if (child.getAttribute('position')){
              rowPosition = child.getAttribute('position');
            }
            if (child.getAttribute('length')){
              rowLength = child.getAttribute('length');
            }
            if (child.getAttribute('leftoverhang')){
              rowLength++;
              // use an additional element on the left to do this
            }
            if (child.getAttribute('rightoverhang')){
              rowLength++;
              // use an additional element on the right to do this
            }
            if (child.getAttribute('mslinethickness')){
              // unsupported except by going through CSS
            }
            break;
          case 'mn':
            var mtr = elementaryMML.createElement('mtr');
            var numbers = child.textContent;
            console.log(numbers);
            for(var j=0;j<numbers.length;j++) {
              var mtd = elementaryMML.createElement('mtd');
              var mn = elementaryMML.createElement('mn');
              mn.textContent = numbers[j];
              mtd.appendChild(mn);
              mtr.appendChild(mtd);
              if (numbers[j] === '.' || numbers[j] === '.'){
                mtr.setAttribute('data-mml-elementary-decimalPos', j);
              }
            }
            rowLine = 'none';
            mtable.appendChild(mtr);
            break;
          default:
            var mtr = elementaryMML.createElement('mtr');
            mtr.appendChild(child)
            rowLine = 'none';
            mtable.appendChild(mtr);
        }
        rowPositions.push(rowPosition);
        rowLengths.push(rowLength);
        rowLines.push(rowLine);
        console.log(rowLength);
      }
      if (childNode.getAttribute('stackalign')){}
      if (childNode.getAttribute('charalign')){}
      if (childNode.getAttribute('charspacing')){}
      // transfer other attributes (delay until this can be integrated into core MathJax

      // fill up rows of different lenghts
      var rows = elementaryMML.getChildren(mtable);
      var maxDecimalPoint = '0';
      for(var i=0;i<rows.length;i++) {
        maxDecimalPoint = Math.max(maxDecimalPoint,rows[i].getAttribute('data-mml-elementary-decimalPos'));
      }
      for(var i=0;i<rows.length;i++) {
        var row = rows[i];
        for (var j = 0; j <  maxDecimalPoint - row.getAttribute('data-mml-elementary-decimalPos'); j++){
          var mtd = elementaryMML.createElement('mtd');
          row.insertBefore(mtd,row.firstChild);
        }
      }
      mtable.setAttribute('rowlines', rowLines.join(' '))
    	parentNode.appendChild(mtable);
    },
    'msrow':  function(parentNode,childNode,rowPosition) {
      if (childNode.getAttribute('position')){
        // prepend or append empty elements
      }
      var decimalPos = '';
      var children = elementaryMML.getChildren(childNode);
      for(var i=0;i<children.length;i++) {
        var child = children[i];
        if (child.tagName === 'mn'){
          var numbers = child.textContent;
          console.log(numbers);
          for(var j=0;j<numbers.length;j++) {
            var mtd = elementaryMML.createElement('mtd');
            var mn = elementaryMML.createElement('mn');
            if (numbers[j] === '.' || numbers[j] === '.'){
              decimalPos = j;
            }
            mn.textContent = numbers[j];
            mtd.appendChild(mn);
            parentNode.appendChild(mtd);
          }
        }
        else {
          var mtd = elementaryMML.createElement('mtd');
          mtd.appendChild(child);
          parentNode.appendChild(mtd);
        }
        console.log(child.tagName);
      }
      if (!parentNode.getAttribute('data-mml-elementary-decimalPos')){
        parentNode.setAttribute('data-mml-elementary-decimalPos', children.length+1);
      }
    }
  }
}


var mathNodes = document.getElementsByTagName('math');
elementaryMML.transformElements(mathNodes);
