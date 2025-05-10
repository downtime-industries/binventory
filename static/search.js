// Search page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fetch all item names for search autocomplete
    fetch('/api/search-suggestions')
        .then(response => response.json())
        .then(data => {
            setupAutocomplete(document.getElementById('searchInput'), data.suggestions);
        })
        .catch(error => {
            console.error('Error fetching search suggestions:', error);
        });
});

function setupAutocomplete(inputElement, items) {
    if (!inputElement) return;
    
    let currentFocus = -1;
    
    // Create autocomplete dropdown
    const createAutocompleteList = function(items, inputElement, inputValue) {
        closeAllLists();
        
        if (!inputValue) { return false; }
        
        const autocompleteList = document.createElement("DIV");
        autocompleteList.setAttribute("class", "autocomplete-items");
        autocompleteList.setAttribute("id", inputElement.id + "-autocomplete-list");
        inputElement.parentNode.appendChild(autocompleteList);
        
        // Filter items that match input value
        const matchingItems = items.filter(item => 
            item.toLowerCase().includes(inputValue.toLowerCase())
        );
        
        for (let i = 0; i < matchingItems.length; i++) {
            const itemElement = document.createElement("DIV");
            
            // Highlight matching part
            const matchIndex = matchingItems[i].toLowerCase().indexOf(inputValue.toLowerCase());
            const beforeMatch = matchingItems[i].substr(0, matchIndex);
            const match = matchingItems[i].substr(matchIndex, inputValue.length);
            const afterMatch = matchingItems[i].substr(matchIndex + inputValue.length);
            
            itemElement.innerHTML = beforeMatch + "<strong>" + match + "</strong>" + afterMatch;
            
            // Store the item value
            itemElement.innerHTML += `<input type='hidden' value='${matchingItems[i]}'>`;
            
            // Click handler
            itemElement.addEventListener("click", function(e) {
                inputElement.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
            });
            
            // Hover handler
            itemElement.addEventListener("mouseenter", function() {
                removeActive(autocompleteList.getElementsByTagName("div"));
                this.classList.add("autocomplete-active");
                currentFocus = Array.from(autocompleteList.getElementsByTagName("div")).indexOf(this);
            });
            
            itemElement.addEventListener("mouseleave", function() {
                this.classList.remove("autocomplete-active");
            });
            
            autocompleteList.appendChild(itemElement);
        }
    };
    
    // Handle input on field
    inputElement.addEventListener("input", function(e) {
        createAutocompleteList(items, this, this.value);
    });
    
    // Handle blur event to close dropdown when focus changes
    inputElement.addEventListener("blur", function(e) {
        // Small delay to allow item clicks to register first
        setTimeout(function() {
            closeAllLists();
        }, 150);
    });
    
    // Handle form submission - ensure dropdown is closed
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function() {
            closeAllLists();
        });
    }
    
    // Handle keydown events for navigation
    inputElement.addEventListener("keydown", function(e) {
        const autocompleteList = document.getElementById(this.id + "-autocomplete-list");
        if (!autocompleteList) return;
        
        const items = autocompleteList.getElementsByTagName("div");
        if (items.length === 0) return;
        
        if (e.key === "ArrowDown") {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (currentFocus > -1) {
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            }
            const searchForm = document.getElementById('searchForm');
            if (searchForm) {
                searchForm.submit();
            }
        } else if (e.key === "Escape") {
            closeAllLists();
        }
    });
    
    // Mark item as active in dropdown
    function addActive(items) {
        if (!items) return false;
        
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (items.length - 1);
        
        items[currentFocus].classList.add("autocomplete-active");
    }
    
    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove("autocomplete-active");
        }
    }
    
    // Close all autocomplete lists except the one passed as argument
    function closeAllLists(element) {
        const lists = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < lists.length; i++) {
            if (element !== lists[i] && element !== inputElement) {
                lists[i].parentNode.removeChild(lists[i]);
            }
        }
    }
    
    // Close dropdown when clicking elsewhere
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

// Modal functions for delete confirmation
function confirmDelete(itemId, itemName) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('delete-message');
    const deleteForm = document.getElementById('deleteForm');
    
    message.textContent = `Are you sure you want to completely delete the entry for "${itemName}"?`;
    deleteForm.action = `/delete/${itemId}`;
    
    modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
}