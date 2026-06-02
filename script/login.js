// 1. Initialize Supabase
const supabaseUrl = 'https://ldkctewkmtdsgheslagm.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2N0ZXdrbXRkc2doZXNsYWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODU1ODYsImV4cCI6MjA5NTk2MTU4Nn0.Zs7gamZXZEwd_DZRTpla3P7BvBn70jGPRdCO8BnRPA8'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Handle Login
const loginForm = document.querySelector("#login-modal form");
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (error) {
        alert("Login failed: " + error.message);
    } else {
        alert("Login successful!");
        window.location.href = "admin/index.html";
    }
});
