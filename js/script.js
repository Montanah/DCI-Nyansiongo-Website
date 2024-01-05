document.addEventListener('DOMContentLoaded', function() {
    var images = ["images/BgImg1.jpeg", "images/BgImg2.jpeg", "images/BgImg3.jpeg", "images/BgImg4.jpeg", "images/BgImg5.jpeg", "images/BgImg6.JPG", "images/BgImg7.JPG", "images/BgImg8.JPG", "images/BgImg9.JPG", "images/BgImg10.JPG", "images/BgImg11.JPG", "images/BgImg12.JPG", "images/BgImg13.JPG", "images/BgImg14.JPG", "images/BgImg15.JPG", "images/BgImg16.JPG", "images/BgImg17.JPG", "images/BgImg18.JPG", "images/BgImg19.JPG", "images/BgImg20.JPG", "images/BgImg21.JPG", "images/BgImg22.JPG"];

    var currentIndex = 0;
    var startIndex = 3; // Change this to start from a different image index

    // Set initial background
    document.getElementById("ValProp").style.backgroundImage = "url(" + images[startIndex] + ")";
    currentIndex = (startIndex + 1) % images.length;

    // Apply smooth transition
    document.getElementById("ValProp").style.transition = "background-image 1s ease-in-out";

    setInterval(function() {
        document.getElementById("ValProp").style.backgroundImage = "url(" + images[currentIndex] + ")";
        currentIndex = (currentIndex + 1) % images.length;
    }, 5000);
});

const navigateToContact = () => {
    document.getElementById("footerDiv3").scrollIntoView({ behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', function () {
    const footer = document.getElementById('aboutusfooter');
    let showFooter = false;

    const handleScroll = () => {
        const scrollY = window.scrollY;
        const pageHeight = document.body.scrollHeight - window.innerHeight;
        const newShowFooter = scrollY >= pageHeight + 5;

        if (newShowFooter !== showFooter) {
            showFooter = newShowFooter;
            footer.style.display = showFooter ? 'block' : 'none';
        }
    };

    window.addEventListener('scroll', handleScroll);

    // clean up event listener on page unload
    window.addEventListener('unload', function () {
        window.removeEventListener('scroll', handleScroll);
    });
});

 // jQuery for swipe functionality using TouchSwipe
 $(document).ready(function () {
    $("#audioContainer").swipe({
        swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
            if (direction === 'left') {
                $(this).find('.audio-item').animate({ scrollLeft: '+=' + $(window).width() });
            } else if (direction === 'right') {
                $(this).find('.audio-item').animate({ scrollLeft: '-=' + $(window).width() });
            }
        }
    });
});
