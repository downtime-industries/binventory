// Modal functions for delete confirmation
function confirmDelete(itemId, itemName) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('delete-message');
    const deleteForm = document.getElementById('deleteForm');
    
    if (!modal || !message || !deleteForm) {
        console.error("Delete modal elements not found in the DOM");
        return;
    }
    
    message.textContent = `Are you sure you want to completely delete the entry for "${itemName}"?`;
    
    // Set item ID as data attribute instead of changing the form action
    deleteForm.dataset.itemId = itemId;
    
    modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Handle the actual deletion via AJAX
async function deleteItem(event) {
    event.preventDefault();
    
    const deleteForm = document.getElementById('deleteForm');
    const itemId = deleteForm.dataset.itemId;
    
    if (!itemId) {
        console.error("No item ID found for deletion");
        return;
    }
    
    try {
        const response = await fetch(`/api/delete/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            // Find the item's li element in the DOM
            const itemElement = document.querySelector(`li[data-item-id="${itemId}"]`);
            if (itemElement) {
                // Remove the item from the DOM
                itemElement.remove();
                
                // Check if there are any items left
                const itemsList = document.querySelector('ul');
                if (itemsList && itemsList.children.length === 0) {
                    // If no items left, show the "No items found" message
                    const emptyState = document.createElement('div');
                    emptyState.className = 'text-center py-10';
                    emptyState.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No items found</h3>
                        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">No items match your criteria.</p>
                    `;
                    itemsList.replaceWith(emptyState);
                }
            } else {
                console.warn(`Couldn't find element with data-item-id="${itemId}"`);
            }
        } else {
            console.error("Failed to delete item:", await response.text());
        }
    } catch (error) {
        console.error("Delete operation failed:", error);
    }
    
    // Close the modal
    closeDeleteModal();
}

// Initialize delete functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('deleteModal');
    const deleteForm = document.getElementById('deleteForm');
    
    if (!deleteModal) {
        console.warn('Delete modal not found in the DOM');
    }
    
    if (deleteForm) {
        // Replace the form submission with our AJAX function
        deleteForm.addEventListener('submit', deleteItem);
    }
});