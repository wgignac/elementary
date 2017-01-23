# mathjax-elementary

A converter for "elementary" MathML which produces MathML supported by MathJax.

Based on work Christian Perfect (ctop.js, content-mathml.js) and inspired by David Carlisle's mml3mml2, ctop.


## rough ideas

* mstack => mtable
  * keep track of maximal row length and make add empty mtd's to make all rows the same
  * keep track of special treatment for non-mn's
* msgroup
  * track attributes and increase mstack-mtable dimensions via none's
* msline
  * if length or position, use padding hack (or just CommonHTML? then borders?)
  * if top element in mstack, wrap mtable in menclose=top
  * else: set rowlines
* mscarries => "convert" to mscarry?
  * mscarry: fun with switches
* mlongdiv: separate out:
  * US notation
  * 2x2 top as separate one
  * long vertical bar as separate one

* attributes first?
  * e.g., position could be resolved before all else by using nones

## CommonHTML experiments

We can set border-collapse and then use borders? Check with Davide if problems lurk. But then we still have SVG to deal with.

<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mtable columnspacing="0em" style="border-collapse:collapse">
    <mtr>
      <mtd />
      <mtd>
        <mn>4</mn>
      </mtd>
      <mtd>
        <mn>2</mn>
      </mtd>
      <mtd>
        <mn>4</mn>
      </mtd>
    </mtr>
    <mtr >
      <mtd style=" border-bottom: 1px solid #000;">
            <mo>+</mo>
      </mtd>
      <mtd style=" border-bottom: 1px solid #000;">
            <none />
      </mtd>
      <mtd style=" border-bottom: 1px solid #000;">
            <mn>3</mn>
      </mtd>
      <mtd>
            <mn>3</mn>
      </mtd>
    </mtr>
  </mtable>
</math>

## general open problems

* transferring all general attributes from a node to its replacements
