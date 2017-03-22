/*********************************************************************
 *
 *  elementaryMML
 *
 *  A converter for "elementary" MathML
 *
 * ----------------------------------------------------------------------
 *
 *  Copyright (c) 2016-2017 krautzource UG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var elementaryMML =  {
  settings: {},
	/* Create an element with given name, belonging to the MathML namespace
	 */
  //  REVIEW is namespacing necessary?
	createElement: function(name) {
		return document.createElementNS('http://www.w3.org/1998/Math/MathML',name);
	},

	/* Get node's children
	 */
  //  REVIEW replace with native parentNode.children?
	getChildren: function(node) {
		var children=[];
		for(var j=0;j<node.childNodes.length; j++ ) {
			if(node.childNodes[j].nodeType==document.ELEMENT_NODE) {
				children.push(node.childNodes[j]);
			}
		}
		return children;
	},
  // Add an element to a parent with given name and text content
  // expects parent, tagname, text content
	appendToken: function(parentNode,name,textContent) {
		var element = elementaryMML.createElement(name);
		element.textContent = textContent;
		parentNode.appendChild(element);
		return element;
	},
  // Transform and replace several <math> elements
  // expects nodelist
  transformElements: function(elements){
    for (var i = 0; i< elements.length;i++){
      var mathNode = elementaryMML.transformElement(elements[i]);
      elements[i].parentNode.replaceChild(mathNode,elements[i]);
    }
  },
  //
  // Transform single <math> element and its children.
  // expects node, returns transformed <math> element with transformed children
	transformElement: function(element) {
		var mathNode = element.cloneNode(false);
		for(var j=0;j<element.childNodes.length; j++ ) {
			elementaryMML.transformChild(mathNode,element.childNodes[j]);
		}
		return mathNode;
	},
  // Transform a MathML child node into MathML child node(s) and attach it/them to the parent
  // expects parentnode (in target), childnode (in orignial)
  transformChild: function(parentNode,childNode,options) {
    if(!childNode) {
      var merror = elementaryMML.createElement('merror');
      elementaryMML.appendToken(merror,'mtext','Missing child node');
      parentNode.appendChild(merror);
      return;
    }
    if (childNode.nodeType==document.ELEMENT_NODE) {
      if(elementaryMML.tokens[childNode.tagName]) {
        // if we have a method for this tag name, apply it
        elementaryMML.tokens[childNode.tagName](parentNode,childNode,options);
      } else {
        // else clone the node and recursively transform
        var clonedChild = childNode.cloneNode(false);
        parentNode.appendChild(clonedChild);
        for(var j=0;j<childNode.childNodes.length; j++ ) {
          elementaryMML.transformChild(clonedChild,childNode.childNodes[j],options);
        }
      }
    } else if (childNode.nodeType==document.TEXT_NODE) {
      // for a text node, clone the text node
      parentNode.appendChild(childNode.cloneNode(false));
    }
  },

// NOTE the main code -- a method for (some) elementaryMML tokens
// current: mstack, msrow
  tokens: {
    // expects parentnode (in target), childnode (in orignial)
    'mstack': function(parentNode,childNode) {
      var mtable = elementaryMML.createElement('mtable');   mtable.setAttribute('data-mml-elementary', 'mstack');
      if (childNode.getAttribute('align')){
        mtable.setAttribute('align', childNode.getAttribute('align'));
      }
      if (childNode.getAttribute('stackalign')){
        // TODO
      }
      var options = {
        menclose: [],
        rowPositions: [],
        rowLengths: [],
        rowLines: []
      }
      mtable.setAttribute('columnspacing', '0');
      // TODO can we do better than equalcolumns?
      // mscarries screw up equal widths; can we have tighter menclose?
      if (childNode.querySelector('mscarries')){
        mtable.setAttribute('equalcolumns',true);
      }
    	var children = elementaryMML.getChildren(childNode);
    	for(var i=0;i<children.length;i++) {
        var child = children[i];
        // TODO not doing anything with these yet!
        var rowPosition = '0';
        var rowLength = '0';
        var rowLine = 'none';
        // PETER: refactoring theory: just do
        // elementaryMML.transformChild(mtable, child, rowPositions etc)
        // handles the child transformation,
        // adds some elements to mstack
        // generates "metadata"
        switch (child.tagName){
          case 'mscarries':
            elementaryMML.transformChild(mtable,child,options);
            break;
          case 'msrow':
            elementaryMML.transformChild(mtable,child,options);
            break;
          case 'msgroup':
            elementaryMML.transformChild(mtable,child,options);
            break;
          case 'msline':
            elementaryMML.transformChild(mtable,child,options);
            break;
          // TODO case 'mstyle' (in particular around mn)
          case 'mn':
            elementaryMML.transformChild(mtable,child,options);
            break;
          default:
            var mtr = elementaryMML.createElement('mtr');
            mtr.appendChild(child)
            rowLine = 'none';
            mtable.appendChild(mtr);
            options.rowPositions.push(rowPosition);
            options.rowLengths.push(rowLength);
            options.rowLines.push(rowLine);
            break;
        }
      }
      if (childNode.getAttribute('stackalign')){}
      if (childNode.getAttribute('charalign')){}
      if (childNode.getAttribute('charspacing')){}
      // TODO transfer other attributes (delay until this can be integrated into core MathJax?)

      // fill up rows of different lengths
      var rows = elementaryMML.getChildren(mtable);
      var maxDecimalPoint = '0';
      // store lengths between possible OP and potential decimalPoint
      var decimalPoints = [];
      var actualDecimalPoints = !!mtable.querySelector('[data-mml-elementary-decimalpos]');
      var tableHasFrontOp = !!mtable.querySelector('[data-mml-elementary-msrow-op-front]');
      // handle children shift values
      // NOTE seed with 0 to avoid max = -infinity
      var shiftValues = [0]
      for(var i=0;i<rows.length;i++) {
        var row = rows[i];
        var shift = row.getAttribute('data-mml-elementary-msrow-shift');
        if (shift) shiftValues.push(shift);
        var frontOp = !!row.getAttribute('data-mml-elementary-msrow-op-front');
        var backOp = !!row.getAttribute('data-mml-elementary-msrow-op-back');
        var decimalPoint = row.children.length - backOp;
        if (row.querySelector('[data-mml-elementary-decimalpos]')){
          decimalPoint = Array.prototype.indexOf.call(row.children,row.querySelector('[data-mml-elementary-decimalpos]'));
        }
        decimalPoints.push(decimalPoint);
        maxDecimalPoint = Math.max(maxDecimalPoint, decimalPoint);
      }
      // maximal shift in stack
      var shiftMax = Math.max.apply(null, shiftValues);
      var shiftMin = Math.min(0, Math.min.apply(null, shiftValues));
      for (var i=0;i<rows.length;i++) {
        var row = rows[i];
        var frontOp = !!row.getAttribute('data-mml-elementary-msrow-op-front');
        var backOp = !!row.getAttribute('data-mml-elementary-msrow-op-back');
        var hasDecimalPoint = !!row.querySelector('[data-mml-elementary-decimalpos]');
        // description: adding the right amount of elements
        // a) maxDecimalPoint - decimalPoints[i] the obvious starting point
        // b) if some row has a front op but this row doesn't, add one to frontOp
        // c) if this row doesn't have a real decimal point, add one less(!)
        // d) handle shift
        // TODO handle negative shifts
        // TODO handle position (which seems to overrule shift? spec says nothing, examples indicate that's the case)
        var shift = Math.max(0, row.getAttribute('data-mml-elementary-msrow-shift'));
        var amount = maxDecimalPoint - decimalPoints[i] + hasDecimalPoint -  actualDecimalPoints + shiftMax - shift + shiftMin;
        for (var j = 0; j < amount; j++){

          var mtd = elementaryMML.createElement('mtd');
            row.insertBefore(mtd,row.children[0]);
        }
      }
      mtable.setAttribute('rowlines', options.rowLines.join(' '))
      // handle full-length top/bottom msline
      var output = mtable;
      if(options.menclose.length > 0){
        var enclose = elementaryMML.createElement('menclose');
        enclose.setAttribute('notation',options.menclose.join(' '));
        enclose.appendChild(mtable);
        var output = enclose;
      }
      parentNode.appendChild(output);
    },
    'mscarries':  function(parentNode,childNode,options) {
      // parentNode assumed to be an mtable
      if (parentNode.tagName !== 'mtable') throw new Error ('msrow new parent must be mtable');
      // TODO when preceded by another mscarries element (cf. mn)
    },
    'msgroup': function(parentNode,childNode,options){
      // Basic idea: turn all children into msrow.
      // TODO this is a first random guess without thinking much
      var position = childNode.getAttribute('position') + parentNode.getAttribute('position');
      var parentShift = parseInt(childNode.parentNode.getAttribute('shift')) || 0;
      var childShift = childNode.getAttribute('shift') || 0;
      var shift = parseInt(childShift) + parseInt(parentShift);
      const grandChildren = elementaryMML.getChildren(childNode);
      const grandChildrenLength = grandChildren.length;
      for (var c = 0; c < grandChildrenLength; c++){
        var grandChild = grandChildren[c];
        var msrow = elementaryMML.createElement('msrow');
        if (grandChild.tagName === 'msrow' || grandChild.tagName === 'msgroup'){
          msrow = grandChild;
        }
        else {
          msrow.appendChild(grandChild);
        }
        msrow.setAttribute('position', position);
        grandChildShift = parseInt(msrow.getAttribute('shift')) || 0;
        // TODO STOPPED HERE, need to work out shift
        // msrow.setAttribute('position', msrow.getAttribute('position') + position);
        if (shift >= 0){
          // shift skips first element
          // TODO clarify spec: use shift*c instead of shift+c-1?
          msrow.setAttribute('shift', shift+grandChildShift+c-1);
        }
        if (shift < 0){
          // shift skips first element
          // TODO clarify spec: use shift*c instead of shift+c-1?
          msrow.setAttribute('shift', shift+grandChildShift-c+1);
        }
        // console.log(msrow.getAttribute('shift'));
        elementaryMML.transformChild(parentNode, msrow, options);
      }
    },
    'msrow':  function(parentNode,childNode,options) {
      if (childNode.getAttribute('position')){
        // prepend or append empty elements -- NOTE William: OR mark the alignment column
      }
      var mtr = elementaryMML.createElement('mtr');
      parentNode.appendChild(mtr);
      var rowPosition = '0';
      var rowLength = '0';
      var rowLine = 'none';
      if (childNode.getAttribute('position')){
        rowPosition = childNode.getAttribute('position');
      }
      if (childNode.getAttribute('length')){
        rowLength = childNode.getAttribute('length');
      }
      //TODO DRY this!!
      options.rowPositions.push(rowPosition);
      options.rowLengths.push(rowLength);
      // TODO When can rowlines occur? E.g., msrow has single child msline with full length. Any other case?
      options.rowLines.push(rowLine);

      var children = elementaryMML.getChildren(childNode);
      for(var i=0;i<children.length;i++) {
        var child = children[i];
        if (child.tagName === 'mn'){
          var numbers = child.textContent.trim();
          for(var j=0;j<numbers.length;j++) {
            var mtd = elementaryMML.createElement('mtd');
            var mn = elementaryMML.createElement('mn');
            if (numbers[j] === '.'){
              mtd.setAttribute('data-mml-elementary-decimalpos', true);
            }
            mn.textContent = numbers[j];
            mtd.appendChild(mn);
            mtr.appendChild(mtd);
          }
        }
        // TODO This seems wrong. msgroup shouldn't be allowed as child of msrow anyway? Correct, that'd be invalid according to the validator
        else if (child.tagName === 'msgroup') {
          elementaryMML.transformElement(mtr,child);
        }
        else {
          var mtd = elementaryMML.createElement('mtd');
          mtd.appendChild(child);
          mtr.appendChild(mtd);
          if( i === 0 && child.tagName==='mo'){
            mtr.setAttribute('data-mml-elementary-msrow-op-front', true);
          }
          if ( i === children.length-1 && child.tagName==='mo'){
            mtr.setAttribute('data-mml-elementary-msrow-op-back', true);
          }
        }
      }
      var shift = childNode.getAttribute('shift');
      if (shift){
        mtr.setAttribute('data-mml-elementary-msrow-shift', shift);
        // prepend empty elements
        if (shift < 0) {
          for (var s = 0; s < Math.abs(shift); s++){
            var filler = elementaryMML.createElement('mtd');
            mtr.insertBefore(filler, mtr.firstChild);
          }
        }
      }
    },
    'msline': function(parentNode,childNode,options) {
      var rowPosition = '0';
      var rowLength = '0';
      var rowLine = 'none';
      if (childNode.getAttribute('position')){
        rowPosition = childNode.getAttribute('position');
      }
      if (childNode.getAttribute('length')){
        rowLength = childNode.getAttribute('length');
        // TODO maybe like TeX macro \bbox[5px,border:2px solid red] ?
      }
      if (childNode.getAttribute('leftoverhang')){
        //TODO add an additional element of correct size
      }
      if (childNode.getAttribute('rightoverhang')){
        //TODO add an additional element of correct size
      }
      if (childNode.getAttribute('mslinethickness')){
        // unsupported except by going through CSS
      }
      // handle immediately preceding/following full-length msline
      if (!childNode.getAttribute('position') && !childNode.getAttribute('length')){
        // NOTE previousElementSibling not in IE<9
        if (!childNode.previousElementSibling){
          options.menclose.push('top');
        }
        // NOTE nextElementSibling not in IE<9
        else if (!childNode.nextElementSibling){
          options.menclose.push('bottom');
        }
        else {
          // change previous row-line
          // NOTE: clashes with ideas to do bottom up for mscarries since the rowline isn't set yet
          options.rowLines[options.rowLines.length - 1] = 'solid';
        }
      }
      options.rowPositions.push(rowPosition);
      options.rowLengths.push(rowLength);
    },
    'mn': function(parentNode,childNode,options) {
      if (childNode.parentNode.tagName !== 'mstack' && childNode.parentNode.tagName !== 'msrow' && childNode.parentNode.tagName !== 'msgroup' && childNode.parentNode.tagName !== 'mstyle'){
        parentNode.appendChild(childNode);
      }
      // TODO rewrite as msrow and move everything to msrow
      // TODO handle RTL, cf https://www.w3.org/Math/draft-spec/mathml.html#chapter3_presm.msrow

      if (childNode.parentNode.tagName === 'mstack'){
        // TODO childNode.parentNode.tagName === 'msgroup'
        var rowPosition = '0';
        var rowLength = '0';
        var rowLine = 'none';
        options.rowPositions.push(rowPosition);
        options.rowLengths.push(rowLength);
        options.rowLines.push(rowLine);
      }
        var mtr = elementaryMML.createElement('mtr');
        // PETER NEW
        if (childNode.parentNode.tagName === 'msrow' ){
          mtr = parentNode;
        }
        var numbers = childNode.textContent.trim();
        for (var j=0; j < numbers.length; j++) {
          var mtd = elementaryMML.createElement('mtd');
          var mn = elementaryMML.createElement('mn');
          mn.textContent = numbers[j];
          mtd.appendChild(mn);
          mtr.appendChild(mtd);
          // TODO make decimalpoint configuration optional (see spec on mstyle being allowed to change it)
          if (numbers[j] === '.'){
            mtd.setAttribute('data-mml-elementary-decimalpos', true);
          }
        }
        parentNode.appendChild(mtr);
        // first attempt at handling mscarries
        var prevChild = childNode.previousElementSibling;
        // PETER NEW: needs to look up correct sibling
        if (childNode.parentNode.tagName === 'msrow' ){
          prevChild =  childNode.parentNode.previousElementSibling;
        }
        if ( prevChild && (prevChild.tagName === 'mscarries')){
          var mtrChildren = elementaryMML.getChildren(mtr);
          // TODO not sure about the  spec.
          // It says "Each child of the mscarries applies to the same column in the following row"
          // this sounds to me like you'd start with the "columns" that mstack describes and walk left to right.
          // But that doesn't seem reflected in the examples.
          // For now: handle mscarries in reverse because that matches the examples
          var reverseMtrLength = mtrChildren.length - 1;
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
              var mpadded = elementaryMML.createElement('mpadded');
              // TODO the voffset is a magic number to position vertically centered scripts.
              // Ask dpvc if there's a better way; if no automated way, make it configurable
              mpadded.setAttribute('voffset','0.15em');
              var mstyle = elementaryMML.createElement('mstyle');
              mstyle.setAttribute('mathsize','small');
              mpadded.appendChild(mstyle);
              mstyle.appendChild(carry);
              mtd.insertBefore(mpadded,enclose);
              if (location === 'w'){
                mtd.insertBefore(mpadded, enclose);
              }
              if (location === 'e'){
                mtd.appendChild(mpadded);
              }
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
          // TODO implement mscarries before another mscarries, see https://www.w3.org/Math/draft-spec/mathml.html#chapter3_id.3.6.5.1
          // TODO implement mscarries before msrow, (msgroup?)
        }
    }
  }
}

if (typeof window === 'undefined') {
    exports.elementaryMML = elementaryMML;
} else {
  var mathNodes = document.getElementsByTagName('math');
  elementaryMML.transformElements(mathNodes);
}
