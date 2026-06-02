// 1. Initialize Supabase
const supabaseUrl = 'YOUR_PROJECT_URL_HERE'; // e.g., 'https://xyz.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY_HERE'; // The long string of characters
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Grab the elements
const modal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeBtn = document.querySelector(".close-btn");
const loginForm = modal.querySelector("form");

// Modal open/close logic
loginBtn.addEventListener("click", (e) => { e.preventDefault(); modal.style.display = "flex"; });
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

