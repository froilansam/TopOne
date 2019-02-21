var a = 4; // a is a global variable, it can be accessed by the functions below

function foo() {
  var b = a * 3;
  function bar(c) {
    var b = 2;
    console.log(a, b, c);
  }

  bar(b * 4);
}

foo(); // 4, 2, 48
