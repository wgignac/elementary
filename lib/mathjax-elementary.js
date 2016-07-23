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
      // TODO can we do better than equalcolumns?
      // mscarries screw up equal widths; can we have tighter menclose?
      // if (childNode.querySelector('mscarries')){
      //   mtable.setAttribute('equalcolumns',true);
      // }
    	var children = elementaryMML.getChildren(childNode);
    	for(var i=0;i<children.length;i++) {
        var child = children[i];
        // TODO not doing anything with these yet!
        var rowPosition = '0';
        var rowLength = '0';
        var rowLine = 'none';
        switch (child.tagName){
          case 'mscarries':
            break;
          case 'msrow':
            var mtr = elementaryMML.createElement('mtr');
            if (child.getAttribute('position')){
              rowPosition = child.getAttribute('position');
            }
            if (child.getAttribute('length')){
              rowLength = child.getAttribute('length');
            }
            elementaryMML.transformChild(mtr,child,rowPosition);
            //TODO DRY this!!
            rowPositions.push(rowPosition);
            rowLengths.push(rowLength);
            rowLines.push(rowLine);
            break;
          case 'msgroup':
            // Basic idea: turn all children into msrow.
            // TODO this is a first random guess without thinking much
            var position = child.getAttribute('position') + parentNode.getAttribute('position');
            var parentShift = parseInt(parentNode.getAttribute('shift')) || 0;
            var shift = parseInt(child.getAttribute('shift')) + parentShift;
            grandChildren =  elementaryMML.getChildren(child);
            for (var c = 0; c < grandChildren.length; c++){
              var grandChild = grandChildren[c];
              var mtr = elementaryMML.createElement('mtr');
              var msrow = elementaryMML.createElement('msrow');
              if (grandChild.tagName === 'msrow'){
                msrow = grandChild;
              }
              else {
                msrow.appendChild(grandChild);
              }
              msrow.setAttribute('position', position);
              if (c > 0){
                // shift skips first element
                // TODO clarify spec: use shift*c instead of shift+c-1?
                msrow.setAttribute('shift', shift+c-1);
              }
              elementaryMML.transformChild(mtr, msrow);
              mtable.appendChild(mtr);
              rowPositions.push(rowPosition);
              rowLengths.push(rowLength);
              rowLines.push(rowLine);
            }
            break;
          case 'msline':
            if (child.getAttribute('position')){
              rowPosition = child.getAttribute('position');
            }
            if (child.getAttribute('length')){
              rowLength = child.getAttribute('length');
            }
            if (child.getAttribute('leftoverhang')){
              //TODO add an additional element of correct size
            }
            if (child.getAttribute('rightoverhang')){
              //TODO add an additional element of correct size
            }
            if (child.getAttribute('mslinethickness')){
              // unsupported except by going through CSS
            }
            // handle immediately following full-length msline
            // TODO handle overhang and thickness
            if (!child.getAttribute('position') && !child.getAttribute('length')){
              if (i === 0){
                var enclose = elementaryMML.createElement('menclose')
                enclose.setAttribute('notation','top');
                enclose.appendChild(mtable);
                var output = enclose;
              }
              else if (!children[i+1]){
                var enclose = elementaryMML.createElement('menclose')
                enclose.setAttribute('notation','bottom');
                enclose.appendChild(mtable);
                var output = enclose;
              }
              else if ( i > 0){
                rowLines[rowLines.length-1] = 'solid';
              }
            }
            rowPositions.push(rowPosition);
            rowLengths.push(rowLength);
            break;
          case 'mn':
          //TODO rewrite as msrow and move everything to msrow
            var mtr = elementaryMML.createElement('mtr');
            var numbers = child.textContent;
            for (var j=0; j < numbers.length; j++) {
              var mtd = elementaryMML.createElement('mtd');
              var mn = elementaryMML.createElement('mn');
              mn.textContent = numbers[j];
              mtd.appendChild(mn);
              mtr.appendChild(mtd);
              // TODO make decimalpoint configuration optional?
              if (numbers[j] === '.'){
                mtd.setAttribute('data-mml-elementary-decimalpos', true);
              }
            }
            rowLine = 'none';
            mtable.appendChild(mtr);
            // first attempt at handling mscarries
            if ( i > 0 && (children[i-1].tagName === 'mscarries')){
              var mtrChildren = elementaryMML.getChildren(mtr);
              // TODO not sure about the  spec.
              // It says "Each child of the mscarries applies to the same column in the following row"
              // this sounds to me like you'd start with the "columns" that mstack describes and walk left to right.
              // But that doesn't seem reflected in the examples.
              // For now: handle mscarries in reverse because that matches the examples
              var reverseMtrLength = mtrChildren.length - 1;
              var prevChild = children[i-1];
              var carries = elementaryMML.getChildren(prevChild);

              var outerLocation = prevChild.getAttribute('location') || 'n';
              var outerNotation = prevChild.getAttribute('crossout') || 'none';
              var position = prevChild.getAttribute('position');
              for (var c = 0; c <  carries.length; c++){
                var reverseLength = carries.length - 1 ;
                // TODO handle local mscarry elements
                var location = outerLocation;
                var notation = outerNotation;
                var carry = carries[reverseLength - c];
                if (carry.tagName === 'mscarry'){
                  location = carry.getAttribute('location') || location;
                  notation = carry.getAttribute('crossout') || notation;
                  carry = carry.children[0];
                }
                var enclose = elementaryMML.createElement('menclose');
                enclose.setAttribute('notation',notation);
                // pick the corresponding child of the mtr
                var mtd = mtrChildren[reverseMtrLength - c];
                var mtdChild = mtd.children[0];
                mtd.insertBefore(enclose,mtdChild);
                if(mtdChild) enclose.appendChild(mtdChild);
                switch (location){
                  case 'w':
                  case 'e':
                  //TODO implement west and east -- how?
                  break;
                  case 'ne':
                  case 'nw':
                  case 'se':
                  case 'sw':
                    var mmultiscript = elementaryMML.createElement('mmultiscripts');
                    mtd.insertBefore(mmultiscript, enclose);
                    mmultiscript.appendChild(enclose);
                    if (location === 'nw' || location === 'sw'){
                      var mprescripts = elementaryMML.createElement('mprescripts');
                      mmultiscript.appendChild(mprescripts);
                      if (location === 'nw') {
                        mprescripts.appendChild(elementaryMML.createElement('none'));
                      }
                      mprescripts.appendChild(carry);
                    }
                    else if (location === 'ne'){
                      mmultiscript.appendChild(elementaryMML.createElement('none'));
                      mmultiscript.appendChild(carry);
                    }
                    else if (location === 'se'){
                      mmultiscript.appendChild(carry);
                    }
                    break;
                  case 's':
                    var munder = elementaryMML.createElement('munder');
                    mtd.insertBefore(munder, enclose);
                    munder.appendChild(enclose);
                    munder.appendChild(carry);
                    break;
                  // n is the default in spec
                  case 'n':
                  case 'default':
                    var mover = elementaryMML.createElement('mover');
                    mtd.insertBefore(mover, enclose);
                    mover.appendChild(enclose);
                    mover.appendChild(carry);
                    break;
                }
              }
              prevChild.parentNode.removeChild(prevChild);
              // TODO implement mscarries before another mscarries, (location should be north) https://www.w3.org/Math/draft-spec/mathml.html#chapter3_id.3.6.5.1
              // TODO implement mscarries before msrow, (msgroup?)
            }
            rowPositions.push(rowPosition);
            rowLengths.push(rowLength);
            rowLines.push(rowLine);
            break;
          default:
            var mtr = elementaryMML.createElement('mtr');
            mtr.appendChild(child)
            rowLine = 'none';
            mtable.appendChild(mtr);
            rowPositions.push(rowPosition);
            rowLengths.push(rowLength);
            rowLines.push(rowLine);
            break;
        }
      }
      if (childNode.getAttribute('stackalign')){}
      if (childNode.getAttribute('charalign')){}
      if (childNode.getAttribute('charspacing')){}
      // TODO transfer other attributes (delay until this can be integrated into core MathJax?)

      // fill up rows of different lenghts
      var rows = elementaryMML.getChildren(mtable);
      var maxDecimalPoint = '0';
      // store lenghts between possible OP and potential decimalPoint
      var decimalPoints = [];
      var actualDecimalPoints = !!mtable.querySelector('[data-mml-elementary-decimalpos]');
      var tableHasFrontOp = !!mtable.querySelector('[data-mml-elementary-msrow-op-front]');
      for(var i=0;i<rows.length;i++) {
        var row = rows[i];
        var frontOp = !!row.getAttribute('data-mml-elementary-msrow-op-front');
        var backOp = !!row.getAttribute('data-mml-elementary-msrow-op-back');
        var decimalPoint = row.children.length - frontOp - backOp;
        if (row.querySelector('[data-mml-elementary-decimalpos]')){
          decimalPoint = Array.prototype.indexOf.call(row.children,row.querySelector('[data-mml-elementary-decimalpos]')) - frontOp;
        }
        decimalPoints.push(decimalPoint);
        maxDecimalPoint = Math.max(maxDecimalPoint, decimalPoint);
      }
      for (var i=0;i<rows.length;i++) {
        var row = rows[i];
        var frontOp = !!row.getAttribute('data-mml-elementary-msrow-op-front');
        var backOp = !!row.getAttribute('data-mml-elementary-msrow-op-back');
        var hasDecimalPoint = !!row.querySelector('[data-mml-elementary-decimalpos]');
        // description: adding the right amount of elements
        // a) maxDecimalPoint - decimalPoints[i] the obvious starting point
        // b) if some row has a front op but this row doesn't, add one to frontOp
        // c) if this row doesn't have a real decimal point, add one less(!)
        var amount = maxDecimalPoint - decimalPoints[i] + tableHasFrontOp - frontOp  + hasDecimalPoint -  actualDecimalPoints;
        for (var j = 0; j < amount; j++){
          var mtd = elementaryMML.createElement('mtd');
          if (frontOp){
            row.insertBefore(mtd,row.children[1]);
          }
          else {
            row.insertBefore(mtd,row.children[0]);
          }
        }
      }
      mtable.setAttribute('rowlines', rowLines.join(' '))
    	if(!output){
        var output = mtable;
      }
      parentNode.appendChild(output);
    },
    'msrow':  function(parentNode,childNode,rowPosition) {
      // parentNode assumed to be an mtr
      if (childNode.getAttribute('position')){
        // prepend or append empty elements
      }
      var children = elementaryMML.getChildren(childNode);
      for(var i=0;i<children.length;i++) {
        var child = children[i];
        if (child.tagName === 'mn'){
          var numbers = child.textContent;
          for(var j=0;j<numbers.length;j++) {
            var mtd = elementaryMML.createElement('mtd');
            var mn = elementaryMML.createElement('mn');
            if (numbers[j] === '.'){
              mtd.setAttribute('data-mml-elementary-decimalpos', true);
            }
            mn.textContent = numbers[j];
            mtd.appendChild(mn);
            parentNode.appendChild(mtd);
          }
        }
        // TODO This seems wrong. msgroup shouldn't be allowed as child of msrow anyway?
        else if (child.tagName === 'msgroup') {
          elementaryMML.transformElement(parentNode,child);
        }
        else {
          var mtd = elementaryMML.createElement('mtd');
          mtd.appendChild(child);
          parentNode.appendChild(mtd);
          if( i === 0 && child.tagName==='mo'){
            parentNode.setAttribute('data-mml-elementary-msrow-op-front', true);
          }
          if ( i === children.length-1 && child.tagName==='mo'){
            parentNode.setAttribute('data-mml-elementary-msrow-op-back', true);
          }
        }
      }
      var shift = childNode.getAttribute('shift');
      if (shift){
        // prepend or append empty elements
        for (var s = 0; s < Math.abs(shift); s++){
          var filler = elementaryMML.createElement('none');
          if (shift > 0){
            parentNode.appendChild(filler);
          }
          if (shift < 0) {
            parentNode.insertBefore(filler, parentNode.firstChild);
          }
          }
      }
    }
  }
}


var mathNodes = document.getElementsByTagName('math');
elementaryMML.transformElements(mathNodes);
