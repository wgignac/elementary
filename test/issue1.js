const tape = require('tape');
const test = require('./setup.js').test;

tape('<mn>: trim whitespace', function(t) {
    t.plan(2);

    // ignore whitespace within mn's e.g., <mn> 7</mn>
    let input1 = `<math display="block"><mstack><msrow><mn> 7</mn></msrow></mstack></math>`;
    // msrows should not matter (require refactoring of main lib)
    let input2 = `<math display="block"><mstack><mn> 7</mn></mstack></math>`;
    let expected =
        `<math display="block"><mtable data-mml-elementary="mstack" columnspacing="0" rowlines="none"><mtr><mtd><mn>7</mn></mtd></mtr></mtable></math>`;

    let result1 = test(input1);
    let result2 = test(input2);
    t.equal(result1, expected, '<mn> with whitespace');
    t.equal(result2, expected, '<mn> with whitespace, wrapped in <msrow>');
});
