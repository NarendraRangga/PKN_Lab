// Grab the elements from the HTML
const modal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeBtn = document.querySelector(".close-btn");

// 1. Open the modal when clicking the 'Login' link in the nav
loginBtn.addEventListener("click", function(event) {
    event.preventDefault(); // Stops the link from jumping to the top of the page
    modal.style.display = "flex"; // Changes from 'none' to 'flex' to show it
});

// 2. Close the modal when clicking the 'x' button
closeBtn.addEventListener("click", function() {
    modal.style.display = "none";
});

// 3. Close the modal when clicking anywhere outside of the white box (on the dark background)
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Get the current year
const currentYear = new Date().getFullYear();
// Get the element with the id 'copyright-year'
const copyrightYearElement = document.getElementById('copyright-year');
// Set the text content of the element to the current year
copyrightYearElement.textContent = currentYear;

const instructbtn = document.getElementById("instructBtn");
const instructCard = document.getElementById("instructGlass");

instructbtn.addEventListener("click", function(event) {
    event.preventDefault(); // Stops the link from jumping to the top of the page
    instructCard.style.display = "block"; // Changes from 'none' to 'block' to show it
    instructCard.scrollIntoView({
        behavior : "smooth"
    });
});