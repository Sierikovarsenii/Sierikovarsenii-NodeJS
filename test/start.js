const expect = require('chai').expect;

it('повинен складати два числа', function() {
    const num1 = 4;
    const num2 = 3;
    expect(num1 + num2).to.equal(7);
})