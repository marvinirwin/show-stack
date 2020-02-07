const {p, render} = require('../index')({width: 10, height: 10});
function A(n) {
    p(`A: ${n}`);
    n = C(n - 1);
    p(`End N: ${n}`);
}
function B(n) {
    p(`B: ${n}`);
    if (n > 10) {
        n = B(n - 1);
    } else {
        n = C(n / 2);
    }
    return C(n);
}
function C(n) {
    p(`C: ${n}`);
    if (n > 6) {
        n =  B(n - 5);
        n = B(n - 1);
        n = C(n);
    }
    return n;
}
A(11);
render();
