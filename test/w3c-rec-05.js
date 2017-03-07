const tape = require('tape');
const test = require('./setup.js').test;

// https://www.w3.org/Math/testsuite/build/main/Topics/ElementaryMathExamples/rec3-ElementaryMathExamples-05-simple.xhtml

tape('MathML Test Suite: REC Examples 05', function(t) {
    t.plan(1);

    let input = `<math display="block"> <mstack> <mscarries> <mscarry crossout="updiagonalstrike"><none/></mscarry> <menclose notation="bottom"> <mn>10</mn> </menclose> </mscarries> <mn>52</mn> <msrow> <mo>-</mo> <mn> 7</mn> </msrow> <msline/> <mn>45</mn> </mstack>`;

    let expected = `<math display="block"> <mtable data-mml-elementary="mstack" columnspacing="0" equalcolumns="true" rowlines="none solid none"><mtr><mtd><mover><menclose notation="updiagonalstrike"><mn>5</mn></menclose><none></none></mover></mtd><mtd><mover><menclose notation="none"><mn>2</mn></menclose><menclose notation="bottom"> <mn>10</mn> </menclose></mover></mtd></mtr><mtr data-mml-elementary-msrow-op-front="true"><mtd><mo>-</mo></mtd><mtd><mn>7</mn></mtd></mtr><mtr><mtd><mn>4</mn></mtd><mtd><mn>5</mn></mtd></mtr></mtable></math>`

    let result = test(input);
    t.equal(result, expected, 'Ok');
});
