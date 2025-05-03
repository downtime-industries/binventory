// Initialize arrays for autocomplete
let areas = [];
let containers = [];
let bins = [];

// Fetch location data
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/locations')
        .then(response => response.json())
        .then(locationData => {
            // Use the location data directly from the API
            areas = locationData.areas || [];
            containers = locationData.containers || [];
            bins = locationData.bins || [];
            
            // Set up autocomplete for each field
            setupAutocomplete(document.getElementById('areaInput'), areas);
            setupAutocomplete(document.getElementById('containerInput'), containers);
            setupAutocomplete(document.getElementById('binInput'), bins);
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
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
            
            autocompleteList.appendChild(itemElement);
        }
    };
    
    // Handle input on field
    inputElement.addEventListener("input", function(e) {
        createAutocompleteList(items, this, this.value);
    });
    
    // Handle focus out - hide autocomplete when clicking outside or tabbing away
    inputElement.addEventListener("blur", function(e) {
        // Use a setTimeout to delay closing the dropdown
        // This ensures that click events on dropdown items can complete first
        setTimeout(function() {
            closeAllLists();
        }, 200);
    });
    
    // Handle form submission - ensure dropdown is closed
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', function() {
            closeAllLists();
        });
    }
    
    // Handle keydown events for navigation
    inputElement.addEventListener("keydown", function(e) {
        const autocompleteList = document.getElementById(this.id + "-autocomplete-list");
        if (!autocompleteList) {
            // If no autocomplete list is visible and Tab is pressed, let default behavior work
            if (e.key === "Tab") {
                return true;
            }
            return;
        }
        
        const items = autocompleteList.getElementsByTagName("div");
        if (items.length === 0) {
            return;
        }
        
        if (e.key === "ArrowDown") {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === "Tab") {
            e.preventDefault();
            
            // If an item is already focused, select it
            if (currentFocus > -1) {
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else {
                // If no item is focused, select the first one
                currentFocus = 0;
                addActive(items);
                items[currentFocus].click();
            }
            
            // Move to the next form field
            const formElements = Array.from(document.getElementById('editForm').elements);
            const currentIndex = formElements.indexOf(this);
            if (currentIndex < formElements.length - 1) {
                formElements[currentIndex + 1].focus();
            }
            
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (currentFocus > -1) {
                // Click the active item
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            }
        } else if (e.key === "Escape") {
            // Close the autocomplete list when Escape is pressed
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