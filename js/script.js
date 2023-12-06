document.addEventListener('DOMContentLoaded', function() {
    var images = ["images/BgImg1.jpeg", "images/BgImg2.jpeg", "images/BgImg3.jpeg", "images/BgImg4.jpeg", "images/BgImg5.jpeg"];
    var currentIndex = 0;

    setInterval(function() {
        document.getElementById("ValProp").style.backgroundImage = "url(" + images[currentIndex] + ")";
        currentIndex = (currentIndex + 1) % images.length;
    }, 5000);
});