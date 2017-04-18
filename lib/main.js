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

var elementaryMML = {
  settings : {},

  ///////////////////////////////////////////////////////////////////////
  // Create an element with given name, belonging to the MathML namespace
  ///////////////////////////////////////////////////////////////////////
  //  REVIEW is namespacing necessary?
	createElement: function(name) {
		return document.createElementNS('http://www.w3.org/1998/Math/MathML', name);
	},

  ///////////////////////////////////////////////////////////////////////
	// Get node's children
  ///////////////////////////////////////////////////////////////////////
  //  REVIEW replace with native parentNode.children?
	getChildren: function(node) {
		var children=[];
		for(var j = 0; j < node.childNodes.length; j++) {
			if(node.childNodes[j].nodeType == document.ELEMENT_NODE) {
				children.push(node.childNodes[j]);
			}
		}
		return children;
	},

  ///////////////////////////////////////////////////////////////////////
  // Add an element to a parent with given name and text content
  // expects parent, tagname, text content
  ///////////////////////////////////////////////////////////////////////
	appendToken: function(parentNode, name, textContent) {
		var element = elementaryMML.createElement(name);
		element.textContent = textContent;
		parentNode.appendChild(element);
		return element;
	},

  ///////////////////////////////////////////////////////////////////////
  // Transform and replace several <math> elements
  // expects nodeList
	///////////////////////////////////////////////////////////////////////
  transformElements: function(elements) {
    for (var i = 0; i < elements.length; i++) {
      var mathNode = elementaryMML.transformElement(elements[i]);
      elements[i].parentNode.replaceChild(mathNode, elements[i]);
    }
  },

  ///////////////////////////////////////////////////////////////////////
  // Transform single <math> element and its children
  // expects node, returns transformed <math> element with transformed children
 	///////////////////////////////////////////////////////////////////////
  transformElement: function(element) {
		var mathNode = element.cloneNode(false);
		for(var j = 0; j < element.childNodes.length; j++) {
			elementaryMML.transformChild(mathNode, element.childNodes[j]);
		}
		return mathNode;
	},

  ///////////////////////////////////////////////////////////////////////
  // Transform a MathML child node into MathML child node(s) and attach it/them to the parent
  // expects parentnode (in target), childnode (in orignal)
  ///////////////////////////////////////////////////////////////////////
  transformChild: function(parentNode, childNode, options) {
    if(!childNode) {
      var merror = elementaryMML.createElement('merror');
      elementaryMML.appendToken(merror, 'mtext', 'Missing child node');
      parentNode.appendChild(merror);
      return;
    }
    if (childNode.nodeType == document.ELEMENT_NODE) {
      if (childNode.tagName === 'mstack' || childNode.tagName === 'mlongdiv') {
        elementaryMML.tokens[childNode.tagName](parentNode, childNode, options);
      } else if (parentNode.getAttribute('data-mml-elementary') && elementaryMML.tokens[childNode.tagName]) {
        elementaryMML.tokens[childNode.tagName](parentNode, childNode, options);
      } else {
        // else clone the node and recursively transform
        var clonedChild = childNode.cloneNode(false);
        parentNode.appendChild(clonedChild);
        for(var j = 0; j < childNode.childNodes.length; j++) {
          elementaryMML.transformChild(clonedChild, childNode.childNodes[j], options);
        }
      }
    } else if (childNode.nodeType == document.TEXT_NODE) {
      // for a text node, clone the text node
      parentNode.appendChild(childNode.cloneNode(false));
    }
  },

  ///////////////////////////////////////////////////////////////////////
  // A helper function which computes align column of an mtr
  // expects an (processed) mtr and an options object
  ///////////////////////////////////////////////////////////////////////
  computeAlignColumn: function(mtr, options){
    var column = 0;
    switch (options.align) {
      case 'decimalpoint':
        // search for position of the units place or decimal in the number,
        // then use this to store the alignment columns of the row.
        // if for some reason the unit or decimal marker isn't there, use last digit
        var children = elementaryMML.getChildren(mtr);
        column = children.length-1;
        for (var j = 0; j < children.length; j++) {
          if(children[j].getAttribute('data-mml-elementary-unit')) {
            column = j;
            break;
          }
          if(children[j].getAttribute('data-mml-elementary-decimalpos')) {
            column = j-1;
            break;
          }
        }
        break;
      case 'left':
        break;
      case 'right':
        column = mtr.childNodes.length - 1;
        break;
      case 'center':
        column = Math.floor(mtr.childNodes.length / 2);
        break;
    }
    return column;
  },

  ///////////////////////////////////////////////////////////////////////
  // A helper function which processes the contents of an <mstack> or <msgroup>
  //
  // parentNode is expected to be an mtable (in the target)
  // rows is a nodelist, the children of the mstack or msgroup being processed
  // options is an object that keeps track of global bookkeeping for formatting
  // position and shift are attributes of the mstack or msgroup being processed
  ///////////////////////////////////////////////////////////////////////
  transformRows: function(parentNode, rows, options, position, shift) {
    for(var i = 0; i < rows.length; i++) {
      row = rows[i];
      switch (row.tagName) {

        case 'msrow':
          // set initial alignColumn for the row, but this value may be
          // modified within msrow token function
          if (row.getAttribute('position')) {
            options.alignColumns.push(parseInt(row.getAttribute('position')) + position + i*shift);
          } else {
            options.alignColumns.push(position + i*shift);
          }
          options.rowLines.push('none');
          // transform and replace the row, mark alignment
          elementaryMML.transformChild(parentNode, row, options);
          break;

        // This case is only reached for standalone <mn> elements
        case 'mn':
          options.alignColumns.push(position + i*shift);
          var mtr = elementaryMML.createElement('mtr');
          mtr.setAttribute('data-mml-elementary', 'msrow');
          elementaryMML.transformChild(mtr, row, options);
          options.alignColumns[options.alignColumns.length-1] += elementaryMML.computeAlignColumn(mtr, options);
          options.rowLines.push('none');
          parentNode.appendChild(mtr);
          break;

        case 'msgroup':
          var rowPos = 0;
          if (row.getAttribute('position')){
            rowPos = parseInt(row.getAttribute('position'));
          }
          var rowShift = 0;
          if (row.getAttribute('shift')){
            rowShift = parseInt(row.getAttribute('shift'));
          }
          var children = elementaryMML.getChildren(row);
          elementaryMML.transformRows(parentNode, children, options, rowPos + position + i*shift, rowShift);
          break;

        case 'mscarries':
          if (row.getAttribute('position')) {
            options.alignColumns.push(parseInt(row.getAttribute('position')) + position + i*shift);
          } else {
            options.alignColumns.push(position + i*shift);
          }
          //options.rowLines.push('none');
          //transform and replace the mscarries, mark alignment
          elementaryMML.transformChild(parentNode, row, options);
          break;

        case 'msline':
          // this would need to be changed to deal with positions/lengths/shifts
          elementaryMML.transformChild(parentNode, row, options);
          break;

        case 'mstyle':
          // TODO: fill in
          break;

        default:
          options.alignColumns.push(position + i*shift);
          options.rowLines.push('none');
          var mtr = elementaryMML.createElement('mtr');
          mtr.setAttribute('data-mml-elementary', 'msrow');
          var mtd = elementaryMML.createElement('mtd');
          mtd.appendChild(row);
          mtr.appendChild(mtd);
          parentNode.appendChild(mtr);
      }
    }
  },

  ///////////////////////////////////////////////////////////////////////
  // NOTE the main code -- a method for (some) elementaryMML tokens
  ///////////////////////////////////////////////////////////////////////

  tokens: {
    /////////////////////////////////////////////////////////////////////
    // Processes <mstack> elements by converting to mtable
    // expects parentNode (target), childNode(original)
    /////////////////////////////////////////////////////////////////////
    'mstack': function(parentNode, childNode) {
      var mtable = elementaryMML.createElement('mtable');
      mtable.setAttribute('data-mml-elementary', 'mstack');

      // Set mtable attributes from mstack's attributes, paying careful
      // attention to defaults that are different in mstack and mtable
      if (childNode.getAttribute('align')){
        mtable.setAttribute('align', childNode.getAttribute('align'));
      } else {
        mtable.setAttribute('align', 'baseline');
      }
      if (childNode.getAttribute('charalign')) {
        mtable.setAttribute('columnalign', childNode.getAttribute('charalign'));
      } else {
        mtable.setAttribute('columnalign', 'right');
      }
      // TODO: Set mtable's columnspacing attribute according to mstack's charspacing attribute.
      mtable.setAttribute('columnspacing', '0');
      // TODO can we do better than equalcolumns?
      // mscarries screw up equal widths; can we have tighter menclose?
      if (childNode.querySelector('mscarries')){
        mtable.setAttribute('equalcolumns',true);
      }

      // initialize the options object, used for formatting bookkeeping
      var options = {
        menclose: [],
        rowLines: [],
        align : '',
        alignColumns : []
      }
      if (childNode.getAttribute('stackalign')){
        options.align = childNode.getAttribute('stackalign');
      } else {
        options.align = 'decimalpoint';
      }

      // now transform the rows
      elementaryMML.transformRows(mtable, elementaryMML.getChildren(childNode), options, 0, 0);

      // now we must pad rows so that alignment is correct
      var maxAlign = Math.max.apply(null, options.alignColumns);
      var children = elementaryMML.getChildren(mtable);
      for (var i = 0; i < children.length; i++) {
        // REVIEW: this only works if all children of mtable are mtrs I think
        // if there are mstyles this might need to be rewritten so that
        // the index of children and the index of options.alignColumns can be
        // different
        for (var j = 0; j < maxAlign - options.alignColumns[i]; j++) {
          var mtd = elementaryMML.createElement('mtd');
          var mphantom = elementaryMML.createElement('mphantom');
          var mn = elementaryMML.createElement('mn');
          mn.textContent = '0';
          mphantom.appendChild(mn);
          mtd.appendChild(mphantom);
          //mtd.appendChild(elementaryMML.createElement('none'));
          children[i].insertBefore(mtd, children[i].children[0]);
        }
      }

      // format the carries appropriately
      // at this point it would make sense to deal with the carries.
      // all the rows in mtable which correspond to carry rows have
      // been marked with the attribute data-mml-elementary="mscarries"
      // and thus are easy to identify.
      // each mtd (that has content) within such an mtr has a
      // data-mml-elementary-carry-location attribute specifiying the
      // location, and (if there should be a crossout) also a
      // data-mml-elementary-carry-crossout attribute.
      // REVIEW: is this method reasonable?
      for (var i = children.length - 1; i >= 0; i--) {
        if (children[i].getAttribute('data-mml-elementary') === 'mscarries') {
          mtable.removeChild(children[i]);
          continue;
        }
        // these are the mtr whose entries we will decorate
        var rowEntries = elementaryMML.getChildren(children[i]);
        // look backwards for carries rows
        for (var j = 1; i >= j; j++) {
          // if we reach a row which isn't a carries row, we're done decorating
          if (children[i-j].getAttribute('data-mml-elementary') !== 'mscarries') break;
          // otherwise, get our carries information
          var carriesRow = elementaryMML.getChildren(children[i-j]);
          // go entry by entry, and decorate
          for (var k = 0; k < Math.min(carriesRow.length, rowEntries.length); k++) {
            // first check for crossouts
            if (carriesRow[k].getAttribute('data-mml-elementary-carry-crossout')) {
              var crossout = carriesRow[k].getAttribute('data-mml-elementary-carry-crossout');
              if (crossout !== 'none') {
                var menclose = elementaryMML.createElement('menclose');
                menclose.setAttribute('notation', crossout);
                while (rowEntries[k].firstChild) {
                  menclose.appendChild(rowEntries[k].removeChild(rowEntries[k].firstChild));
                }
                rowEntries[k].appendChild(menclose);
              }
            }
            // next handle location
            if (carriesRow[k].getAttribute('data-mml-elementary-carry-location')) {
              var location = carriesRow[k].getAttribute('data-mml-elementary-carry-location');
              if (rowEntries[k].childNodes.length > 1) {
                var menclose = elementaryMML.createElement('menclose');
                menclose.setAttribute('notation', 'none');
                while (rowEntries[k].firstChild) {
                  menclose.appendChild(rowEntries[k].removeChild(rowEntries[k].firstChild));
                }
                rowEntries[k].appendChild(menclose);
              }
              if (carriesRow[k].childNodes.length > 1) {
                var menclose = elementaryMML.createElement('menclose');
                menclose.setAttribute('notation', 'none');
                while (carriesRow[k].firstChild) {
                  menclose.appendChild(carriesRow[k].removeChild(carriesRow[k].firstChild));
                }
                carriesRow[k].appendChild(menclose);
              }
              switch (location) {
                case 'ne':
                case 'nw':
                case 'se':
                case 'sw':
                  var mmultiscripts = elementaryMML.createElement('mmultiscripts');
                  var theEntry = rowEntries[k].firstChild;
                  rowEntries[k].insertBefore(mmultiscripts, theEntry);
                  mmultiscripts.appendChild(theEntry);
                  if (location === 'nw' || location === 'sw') {
                    var mprescripts = elementaryMML.createElement('mprescripts');
                    mmultiscripts.appendChild(mprescripts);
                    if (location === 'nw') {
                      mprescripts.appendChild(elementaryMML.createElement('none'));
                    }
                    mprescripts.appendChild(carriesRow[k].firstChild);
                  } else {
                    if (location === 'ne') {
                      mmultiscripts.appendChild(elementaryMML.createElement('none'));
                    }
                    mmultiscripts.appendChild(carriesRow[k].firstChild);
                  }
                  break;
                case 'w':
                  var mstyle = elementaryMML.createElement('mstyle');
                  mstyle.setAttribute('scriptlevel', '+1');
                  mstyle.appendChild(carriesRow[k].firstChild);
                  rowEntries[k].insertBefore(mstyle, rowEntries[k].firstChild);
                  break;
                case 'e':
                  var mstyle = elementaryMML.createElement('mstyle');
                  mstyle.setAttribute('scriptlevel', '+1');
                  mstyle.appendChild(carriesRow[k].firstChild);
                  rowEntries[k].appendChild(mstyle);
                  break;
                case 's':
                  var munder = elementaryMML.createElement('munder');
                  var theEntry = rowEntries[k].firstChild;
                  rowEntries[k].insertBefore(munder, theEntry);
                  munder.appendChild(theEntry);
                  munder.appendChild(carriesRow[k].firstChild);
                  break;
                case 'n':
                default:
                  var mover = elementaryMML.createElement('mover');
                  var theEntry = rowEntries[k].firstChild;
                  rowEntries[k].insertBefore(mover, theEntry);
                  mover.appendChild(theEntry);
                  mover.appendChild(carriesRow[k].firstChild);
              }
            }
          }
        }
      }

      // now deal with rowlines
      mtable.setAttribute('rowlines', options.rowLines.join(' '))
      var output = mtable;
      if(options.menclose.length > 0){
        var enclose = elementaryMML.createElement('menclose');
        enclose.setAttribute('notation',options.menclose.join(' '));
        enclose.appendChild(mtable);
        var output = enclose;
      }
      parentNode.appendChild(output);


    },

    /////////////////////////////////////////////////////////////////////
    // Processes <mlongdiv> elements by converting to mtable
    // expects parentNode (target), childNode(original)
    /////////////////////////////////////////////////////////////////////
    'mlongdiv': function(parentNode, childNode) {
      // TODO: fill in
      parentNode.appendChild(childNode);
    },


    /////////////////////////////////////////////////////////////////////
    // Processes <msrow> elements by converting to mtr
    // expects parentNode (target), childNode(original), and options object
    /////////////////////////////////////////////////////////////////////
    'msrow': function(parentNode, childNode, options) {
      var mtr = elementaryMML.createElement('mtr');
      mtr.setAttribute('data-mml-elementary', 'msrow');
      var children = elementaryMML.getChildren(childNode);
      for(var i = 0; i < children.length; i++) {
        if(children[i].tagName === 'mn'){
          elementaryMML.transformChild(mtr, children[i], options);
        } else {
          var mtd = elementaryMML.createElement('mtd');
          mtd.appendChild(children[i]);
          mtr.appendChild(mtd);
        }
      }
      options.alignColumns[options.alignColumns.length-1] += elementaryMML.computeAlignColumn(mtr, options);
      parentNode.appendChild(mtr);
    },

    /////////////////////////////////////////////////////////////////////
    // Processes <mn> elements by converting to mtds
    // expects parentNode (target), childNode(original), and options object
    /////////////////////////////////////////////////////////////////////
    'mn': function(parentNode, childNode, options) {
      // at this point parentNode should be an mtr or maybe mstyle?
      // REVIEW: should we check for this here?
      var numbers = childNode.textContent.trim();
      var hasADecimalPoint = false;
      for (var i = 0; i < numbers.length; i++) {
        var mtd = elementaryMML.createElement('mtd');
        var mn = elementaryMML.createElement('mn');
        mn.textContent = numbers[i];
        mtd.appendChild(mn);
        if (numbers[i] === '.') { //TODO: allow for other decimal points from mstyle
          hasADecimalPoint = true;
          mtd.setAttribute('data-mml-elementary-decimalpos', true);
          if (i > 0) {
            // REVIEW: should this be lastElementChild?
            parentNode.lastChild.setAttribute('data-mml-elementary-unit', true);
          }
        }
        parentNode.appendChild(mtd);
      }
      if(!hasADecimalPoint) {
        // REVIEW: should this be lastElementChild?
        parentNode.lastChild.setAttribute('data-mml-elementary-unit', true);
      }
    },

    /////////////////////////////////////////////////////////////////////
    // Processes <mscarries> elements
    // expects parentNode (target), childNode(original), and options object
    /////////////////////////////////////////////////////////////////////
    'mscarries': function(parentNode, childNode, options) {
      var mtr = elementaryMML.createElement('mtr');
      mtr.setAttribute('data-mml-elementary', 'mscarries');

      var location = 'n';
      if (childNode.getAttribute('location')) {
        location = childNode.getAttribute('location');
      }
      var crossout = 'none';
      if (childNode.getAttribute('crossout')) {
        crossout = childNode.getAttribute('crossout');
      }

      children = elementaryMML.getChildren(childNode);
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var mtd = elementaryMML.createElement('mtd');
        // if (child.tagName === 'none'){
        //   mtr.append(mtd);
        //   continue;
        // }
        mtd.setAttribute('data-mml-elementary-carry-location', location);
        if (crossout !== 'none') {
          mtd.setAttribute('data-mml-elementary-carry-crossout', crossout);
        }
        var mstyle = elementaryMML.createElement('mstyle');
        mstyle.setAttribute('displaystyle', false);
        if (childNode.getAttribute('scriptsizemultiplier')){
          mstyle.setAttribute('scriptsizemultiplier', childNode.getAttribute('scriptsizemultiplier'));
        }
        mtd.appendChild(mstyle);
        if (child.tagName === 'mscarry') {
          if (child.getAttribute('location')){
            mtd.setAttribute('data-mml-elementary-carry-location', child.getAttribute('location'));
          }
          if (child.getAttribute('crossout')){
            mtd.setAttribute('data-mml-elementary-carry-crossout', child.getAttribute('crossout'));
          }
          var grandChildren = elementaryMML.getChildren(child);
          for (var j = 0; j < grandChildren.length; j++) {
            mstyle.appendChild(grandChildren[j]);
          }
        } else {
            mstyle.append(child);
        }
        mtr.appendChild(mtd);
      }
      options.alignColumns[options.alignColumns.length-1] += mtr.childNodes.length-1;
      parentNode.appendChild(mtr);

    },

    /////////////////////////////////////////////////////////////////////
    // Processes <msline> elements
    // expects parentNode (target), childNode(original), and options object
    /////////////////////////////////////////////////////////////////////
    'msline': function(parentNode, childNode, options) {
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
          options.rowLines[options.rowLines.length - 1] = 'solid';
        }
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
