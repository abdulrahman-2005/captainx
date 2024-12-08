let removedData = [];
let isMobile = false;
let navLinksStyle
let navigationStyle

window.onload = () => {
    const handleResize = () => {
        const navLinks = document.querySelectorAll(".nav-link");
        const windowWidth = window.innerWidth;
        const navigation = document.querySelector(".navigation");

        // Only modify if crossing the mobile threshold
        if (windowWidth < 768 && !isMobile) {
            isMobile = true;
            removedData = [];
            navLinksStyle = navLinks[0].style;
            navigationStyle = navigation.style;

            // Store and remove text for each nav link
            navLinks.forEach(navLink => {
                const removeFrom = navLink.innerHTML.indexOf("</i>");
                const fullContent = navLink.innerHTML;
                removedData.push(fullContent);
                navLink.innerHTML = fullContent.substring(0, removeFrom + 4);
                navLink.style.display = "flex";
                navLink.style.flexDirection = "column";
                navLink.style.alignItems = "center";
                navLink.style.justifyContent = "center";
            });

            // Set mobile navigation styles
            navigation.style.display = "flex";
            navigation.style.flexDirection = "row";
            navigation.style.justifyContent = "space-between";
            navigation.style.alignItems = "center";
            navigation.style.gap = "10px";

        } else if (windowWidth >= 768 && isMobile) {
            isMobile = false;

            // Restore original content
            navLinks.forEach((navLink, index) => {
                navLink.innerHTML = removedData[index];
                navLink.style = navLinksStyle;
            });
            navigation.style = navigationStyle;
        }
    };

    // Run on load and add resize listener
    handleResize();
    window.addEventListener("resize", handleResize);
}
