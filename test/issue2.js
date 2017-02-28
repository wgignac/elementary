const tape = require('tape');
const test = require('./setup.js').test;

tape('msrow with operator at front', function(t) {
    t.plan(1);
    let input = `<math display="block"><mstack><msrow><mo>-</mo><mn>7</mn></msrow><mn>45</mn></mstack></math>`;
    let expected =
        `<math display="block"><mtable data-mml-elementary="mstack" columnspacing="0" rowlines="none none"><mtr data-mml-elementary-msrow-op-front="true"><mtd><mo>-</mo></mtd><mtd><mn>7</mn></mtd></mtr><mtr><mtd><mn>4</mn></mtd><mtd><mn>5</mn></mtd></mtr></mtable></math>`;
    let result = test(input);
    t.equal(result, expected, 'Operator does not create extra column');
});
