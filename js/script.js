document.addEventListener('DOMContentLoaded', function() {
    // Preload all images for smoother transitions
    const images = [
        "images/BgImg1.jpeg", "images/BgImg2.jpeg", "images/BgImg3.jpeg", 
        "images/BgImg4.jpeg", "images/BgImg5.jpeg", "images/BgImg6.JPG", 
        "images/BgImg7.JPG", "images/BgImg8.JPG", "images/BgImg9.JPG", 
        "images/BgImg10.JPG", "images/BgImg11.JPG", "images/BgImg12.JPG", 
        "images/BgImg13.JPG", "images/BgImg14.JPG", "images/BgImg15.JPG", 
        "images/BgImg16.JPG", "images/BgImg17.JPG", "images/BgImg18.JPG", 
        "images/BgImg19.JPG", "images/BgImg20.JPG", "images/BgImg21.JPG", 
        "images/BgImg22.JPG"
    ];
    
    // Cache DOM element
    const valPropElement = document.getElementById("ValProp");
    
    // Preload images
    images.forEach(img => {
        new Image().src = img;
    });

    let currentIndex = 3; // Start from index 3
    
    // Set initial background
    valPropElement.style.backgroundImage = `url(${images[currentIndex]})`;
    valPropElement.style.transition = "background-image 1s ease-in-out";
    
    // Use requestAnimationFrame for smoother animations
    let lastUpdate = 0;
    const interval = 5000; // 5 seconds
    
    function updateBackground(timestamp) {
        if (!lastUpdate || timestamp - lastUpdate >= interval) {
            currentIndex = (currentIndex + 1) % images.length;
            valPropElement.style.backgroundImage = `url(${images[currentIndex]})`;
            lastUpdate = timestamp;
        }
        requestAnimationFrame(updateBackground);
    }
    
    requestAnimationFrame(updateBackground);
});
    
const navigateToContact = () => {
    document.getElementById("footerDiv3").scrollIntoView({ behavior: 'smooth' });
};

// Swipe functionality for footer
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

// Swipe functionality for events
document.addEventListener("DOMContentLoaded", function () {
    const swipeList = document.getElementById("projectsSwipe");
    const totalEvents = swipeList.children.length;
    let currentEvent = 0;

    const handlePrevEvent = () => {
        currentEvent = Math.max(currentEvent - 1, 0);
        updateSwipeList();
    }

    const handleNextEvent = () => {
        currentEvent = Math.min(currentEvent + 1, totalEvents - 1);
        updateSwipeList();
    }

    const updateSwipeList = () => {
        // Hide all events
        Array.from(swipeList.children).forEach(event => {
            event.classList.remove('active');
        });

        // Show current event
        swipeList.children[currentEvent].classList.add('active');

        // Toggle visibility of arrows based on current event
        document.getElementById("leftArrow").style.visibility = currentEvent === 0 ? 'hidden' : 'visible';
        document.getElementById("rightArrow").style.visibility = currentEvent === totalEvents - 1 ? 'hidden' : 'visible';
    }

    // Swipe events for desktop (using mouse)
    let startX = null;

    const handleTouchStart = (e) => {
        startX = e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleTouchEnd = (e) => {
        if (!startX) return;
        const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 50) {  // 50px is a threshold for swipe
            if (diffX > 0) {
                handleNextEvent();
            } else {
                handlePrevEvent();
            }
        }

        startX = null;
    };

    swipeList.addEventListener('mousedown', handleTouchStart);
    swipeList.addEventListener('mouseup', handleTouchEnd);

    // Initialize swipe list
    updateSwipeList();

    // Expose functions to global scope
    window.handlePrevEvent = handlePrevEvent;
    window.handleNextEvent = handleNextEvent;
});

 // jQuery for swipe functionality using TouchSwipe for the audio items
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
