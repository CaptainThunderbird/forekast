export const CATEGORY_OPTIONS = [
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'FICTION_MEDIA', label: 'Fiction & Media' },
  { value: 'OTHER', label: 'Other' },
]

export const categoryLabel = (value) => (
  CATEGORY_OPTIONS.find((category) => category.value === value)?.label || value || 'Other'
)
