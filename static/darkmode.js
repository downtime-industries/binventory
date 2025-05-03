// Dark mode functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference or respect OS setting
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Handle dark mode toggle click
    document.getElementById('darkModeToggle').addEventListener('click', function() {
        if (document.documentElement.classList.contains('dark')) {
            // Switch to light mode
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            // Switch to dark mode
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    });
});