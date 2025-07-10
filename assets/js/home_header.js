let header_title = document.getElementById("header_title");
let pizza1 = document.getElementById("pizza1");
let pizza2 = document.getElementById("pizza2");
let pizza3 = document.getElementById("pizza3");

window.addEventListener("scroll", () => {
    let value = window.scrollY;
    
    header_title.style.marginTop = value * 1 + "px";
    pizza1.style.left = value * 1 + "px";
    pizza2.style.left = value * -1.25 + "px";
    pizza3.style.left = value * 2 + "px";
})