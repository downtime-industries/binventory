import { useState, useEffect } from 'react';
import { useCreateItem, useUpdateItem } from '../../hooks/useItems';
import { useTags } from '../../hooks/useTags';
import { useAreas } from '../../hooks/useAreas';
import { useContainers } from '../../hooks/useContainers';
import { useBins } from '../../hooks/useBins';
import AutocompleteInput from '../common/AutocompleteInput';

interface ItemFormProps {
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    area: string | null;
    container: string | null;
    bin: string | null;
    quantity: number;
    cost: number;
    url: string | null;
    tags: Array<{ tag: string }>;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

const ItemForm = ({ initialData, onSubmit, onCancel }: ItemFormProps) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    area: initialData?.area || '',
    container: initialData?.container || '',
    bin: initialData?.bin || '',
    quantity: initialData?.quantity || 1,
    cost: initialData?.cost || 0,
    url: initialData?.url || '',
    tags: initialData?.tags?.map(t => t.tag) || [],
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const { data: existingTags = [] } = useTags();
  const { data: areas = [] } = useAreas();
  const { data: containers = [] } = useContainers();
  const { data: bins = [] } = useBins();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'cost' ? parseFloat(value) : parseInt(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.name
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AutocompleteInput
          id="area"
          name="area"
          label="Area"
          value={formData.area}
          onChange={handleChange}
          onSelect={(value) => setFormData(prev => ({ ...prev, area: value }))}
          suggestions={areas}
          placeholder="Select or enter area"
          nextFieldId="container"
        />

        <AutocompleteInput
          id="container"
          name="container"
          label="Container"
          value={formData.container}
          onChange={handleChange}
          onSelect={(value) => setFormData(prev => ({ ...prev, container: value }))}
          suggestions={containers}
          placeholder="Select or enter container"
          nextFieldId="bin"
        />

        <AutocompleteInput
          id="bin"
          name="bin"
          label="Bin"
          value={formData.bin}
          onChange={handleChange}
          onSelect={(value) => setFormData(prev => ({ ...prev, bin: value }))}
          suggestions={bins}
          placeholder="Select or enter bin"
          nextFieldId="quantity"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="0"
            step="1"
            value={formData.quantity}
            onChange={handleNumberChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cost ($)
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={handleNumberChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          URL
        </label>
        <input
          type="text"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>
        <div className="flex mt-1">
          <div className="flex-grow">
            <AutocompleteInput
              id="tag-input"
              name="tag"
              label=""
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onSelect={(value) => {
                setNewTag(value);
                // Automatically add tag when selected from autocomplete
                if (value && !formData.tags.includes(value)) {
                  setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, value]
                  }));
                  setNewTag('');
                }
              }}
              suggestions={existingTags.filter(tag => !formData.tags.includes(tag))}
              placeholder="Add a tag"
              // After adding a tag, focus stays in the tag input field
              // since we may want to add multiple tags
            />
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            className="ml-2 mt-1 px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white dark:hover:bg-gray-500"
          >
            Add
          </button>
        </div>

        {/* Display selected tags */}
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={createMutation.isLoading || updateMutation.isLoading}
        >
          {createMutation.isLoading || updateMutation.isLoading
            ? 'Saving...'
            : isEditing
              ? 'Update Item'
              : 'Create Item'}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
