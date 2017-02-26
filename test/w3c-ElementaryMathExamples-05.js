var tape = require('tape');
var elementaryMML = require('../lib/mathjax-elementary.js');
var jsdom = require('jsdom').jsdom;

// https://www.w3.org/Math/testsuite/build/main/Topics/ElementaryMathExamples/rec3-ElementaryMathExamples-05-simple.xhtml

tape('msrow with operator at front', function(t) {
    t.plan(2);
    let input1 = `<math display="block"><mstack><msrow><mo>-</mo><mn>7</mn></msrow><mn>45</mn></mstack></math>`;
    let expected1 =
    `<math display="block"><mtable data-mml-elementary="mstack" columnspacing="0" rowlines="none none"><mtr data-mml-elementary-msrow-op-front="true"><mtd><mo>-</mo></mtd><mtd><mn>7</mn></mtd></mtr><mtr><mtd><mn>4</mn></mtd><mtd><mn>5</mn></mtd></mtr></mtable></math>`;
    
    // TODO isolate  test: ignore whitespace within mn's e.g., <mn> 7</mn>
    let input2 = `<math display="block"> <mstack> <mscarries> <mscarry crossout="updiagonalstrike"><none/></mscarry> <menclose notation="bottom"> <mn>10</mn> </menclose> </mscarries> <mn>52</mn> <msrow> <mo>-</mo> <mn> 7</mn> </msrow> <msline/> <mn>45</mn> </mstack>`;

    let expected2 = `<math display="block"> <mtable data-mml-elementary="mstack" columnspacing="0" equalcolumns="true" rowlines="none solid none"><mtr><mtd><mover><menclose notation="updiagonalstrike"><mn>5</mn></menclose><none></none></mover></mtd><mtd><mover><menclose notation="none"><mn>2</mn></menclose><menclose notation="bottom"> <mn>10</mn> </menclose></mover></mtd></mtr><mtr data-mml-elementary-msrow-op-front="true"><mtd><mo>-</mo></mtd><mtd><mn>7</mn></mtd></mtr><mtr><mtd><mn>4</mn></mtd><mtd><mn>5</mn></mtd></mtr></mtable></math>`

// this is probably generic for almost all tests
let test = function(input, expected){
  let doc = jsdom(input);
  let window = doc.defaultView;
  document = window.document;
  window.elementaryMML =  elementaryMML.elementaryMML;
  let mathNodes = window.document.getElementsByTagName('math');
  window.elementaryMML.transformElements(mathNodes);
  let result = window.document.body.firstChild.outerHTML;
  t.equal(result, expected, 'Operator does not create extra column');
}

test(input1, expected1);
test(input2, expected2);
});
