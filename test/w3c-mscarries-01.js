const tape = require('tape');
const test = require('./setup.js').test;

// https://www.w3.org/Math/testsuite/build/main/Topics/ElementaryMathExamples/ElementaryMathExamples-mscarries01-simple.xhtml

tape('MathML Test Suite: mscarries 01', function(t) {
    t.plan(1);
    let input = `<math xmlns="http://www.w3.org/1998/Math/MathML"> <mstack> <mscarries crossout="downdiagonalstrike"> <mn>2</mn> <mn>12</mn> <mscarry crossout="none"> <none/> </mscarry> </mscarries> <mn>2,327</mn> <msrow> <mo>-</mo> <mn> 1,156</mn> </msrow> <msline/> <mn>1,171</mn> </mstack> </math>`;

    let expected =
    `<math xmlns="http://www.w3.org/1998/Math/MathML"> <mtable data-mml-elementary="mstack" columnspacing="0" equalcolumns="true" rowlines="none solid none"><mtr><mtd></mtd><mtd><mn>2</mn></mtd><mtd><mn>,</mn></mtd><mtd><mover><menclose notation="downdiagonalstrike"><mn>3</mn></menclose><mn>2</mn></mover></mtd><mtd><mover><menclose notation="downdiagonalstrike"><mn>2</mn></menclose><mn>12</mn></mover></mtd><mtd><mover><menclose notation="none"><mn>7</mn></menclose><none></none></mover></mtd></mtr><mtr data-mml-elementary-msrow-op-front="true"><mtd><mo>-</mo></mtd><mtd><mn>1</mn></mtd><mtd><mn>,</mn></mtd><mtd><mn>1</mn></mtd><mtd><mn>5</mn></mtd><mtd><mn>6</mn></mtd></mtr><mtr><mtd></mtd><mtd><mn>1</mn></mtd><mtd><mn>,</mn></mtd><mtd><mn>1</mn></mtd><mtd><mn>7</mn></mtd><mtd><mn>1</mn></mtd></mtr></mtable> </math>`

    let result = test(input);
    t.equal(result, expected, 'Ok');

});
