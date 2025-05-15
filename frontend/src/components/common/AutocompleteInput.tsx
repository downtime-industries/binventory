import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface AutocompleteInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (value: string) => void;
  suggestions: any[]; // Allow any type of suggestion array
  placeholder?: string;
  nextFieldId?: string; // ID of the next field to focus after selection
}

const AutocompleteInput = ({
  id,
  name,
  label,
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  nextFieldId
}: AutocompleteInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // First, convert all suggestions to strings, filtering out null/undefined values
    const stringifiedSuggestions = suggestions
      .filter(suggestion => suggestion !== null && suggestion !== undefined)
      .map(suggestion => {
        // If it's already a string, return it directly
        if (typeof suggestion === 'string') return suggestion;
        
        // If it's an object with a 'tag' property (for tags), use that
        if (suggestion && typeof suggestion === 'object' && 'tag' in suggestion) {
          return String(suggestion.tag);
        }
        
        // If it's an object with a 'name' property, use that (for other entities)
        if (suggestion && typeof suggestion === 'object' && 'name' in suggestion) {
          return String(suggestion.name);
        }
        
        // Otherwise convert to string as best we can
        try {
          return String(suggestion);
        } catch (e) {
          console.error("Failed to convert suggestion to string:", suggestion);
          return "";
        }
      });
    
    // Filter suggestions based on input
    if (value) {
      const filtered = stringifiedSuggestions.filter(
        (suggestion) => suggestion && suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit to top 10 results
    } else if (showSuggestions) {
      // When input is empty but dropdown is focused, show all suggestions
      setFilteredSuggestions(stringifiedSuggestions.filter(s => s).slice(0, 10)); // Limit to top 10 results
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, suggestions, showSuggestions]);

  const handleFocus = () => {
    setShowSuggestions(true);
    // When focusing, if there's no input, show all suggestions
    if (!value && suggestions.length > 0) {
      setFilteredSuggestions(suggestions.slice(0, 10));
    }
  };

  const handleBlur = () => {
    // Small delay to allow click on suggestion to work
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // If the user presses the down arrow and the dropdown is not showing,
    // show it with all suggestions
    if (e.key === 'ArrowDown' && !showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
      setFilteredSuggestions(suggestions.slice(0, 10)); // Limit to top 10
      setHighlightedIndex(0);
      return;
    }
    
    // Only handle special keys if we have suggestions and the dropdown is showing
    if (filteredSuggestions.length > 0 && showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prevIndex) => 
            prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prevIndex) => 
            prevIndex > 0 ? prevIndex - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Tab':
          e.preventDefault();
          onSelect(filteredSuggestions[highlightedIndex]);
          setShowSuggestions(false);
          focusNextField();
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredSuggestions[highlightedIndex]) {
            onSelect(filteredSuggestions[highlightedIndex]);
            setShowSuggestions(false);
            focusNextField();
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    }
  };

  // Helper function to focus the next field
  const focusNextField = () => {
    if (nextFieldId) {
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        setTimeout(() => {
          nextField.focus();
        }, 0);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div>
          <ul 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`cursor-pointer select-none py-2 px-3 ${
                  index === highlightedIndex 
                    ? 'bg-blue-500 text-white dark:bg-blue-600' 
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {typeof suggestion === 'string' ? suggestion : ''}
              </li>
            ))}
          </ul>
          <div className="absolute z-10 mt-1 w-full text-xs text-gray-500 dark:text-gray-400 text-right pt-1 pr-2">
            <span>Use ↑↓ to navigate, Tab/Enter to select</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
