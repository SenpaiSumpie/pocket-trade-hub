// Ionicons-to-Phosphor migration reference.
// Each file imports Phosphor components directly -- this file is for documentation only.
// After migration, verify: grep -r "Ionicons\|@expo/vector-icons" apps/mobile/ returns 0 results

export const ICON_MAP = {
  // Navigation
  home: 'House',
  albums: 'Stack',
  storefront: 'Storefront',
  'swap-horizontal': 'ArrowsLeftRight',
  trophy: 'Trophy',
  person: 'User',

  // Actions
  close: 'X',
  checkmark: 'Check',
  'checkmark-circle': 'CheckCircle',
  add: 'Plus',
  'add-circle': 'PlusCircle',
  remove: 'Minus',
  trash: 'Trash',

  // Directional
  'chevron-forward': 'CaretRight',
  'chevron-back': 'CaretLeft',
  'chevron-down': 'CaretDown',
  'chevron-up': 'CaretUp',
  'arrow-back': 'ArrowLeft',
  'arrow-up-circle': 'ArrowCircleUp',
  'arrow-down-circle': 'ArrowCircleDown',

  // Content
  star: 'Star',
  'star-half': 'StarHalf',
  heart: 'Heart',
  'heart-dislike': 'HeartBreak',
  diamond: 'Diamond',
  flag: 'Flag',

  // UI Elements
  search: 'MagnifyingGlass',
  'copy-outline': 'Copy',
  'share-outline': 'ShareNetwork',
  'calculator-outline': 'Calculator',
  'calendar-outline': 'Calendar',
  flash: 'Lightning',
  'shield-checkmark': 'ShieldCheck',
  'lock-closed': 'Lock',

  // Communication
  'paper-plane': 'PaperPlaneTilt',
  'notifications-outline': 'Bell',
  'notifications-off-outline': 'BellSlash',
  'alert-circle': 'WarningCircle',
  'information-circle': 'Info',

  // Settings / Profile
  'settings-outline': 'Gear',
  'create-outline': 'PencilSimple',
  'log-out-outline': 'SignOut',
  'language-outline': 'Globe',
  'time-outline': 'Clock',
  'link-outline': 'Link',
  'person-remove-outline': 'UserMinus',

  // Content types
  'layers-outline': 'Stack',
  'gift-outline': 'Gift',
  'bulb-outline': 'Lightbulb',
  'newspaper-outline': 'Newspaper',
  'document-text-outline': 'FileText',
  'list-outline': 'List',
  analytics: 'ChartBar',
  'return-up-back': 'ArrowUUpLeft',
  'git-compare': 'GitBranch',

  // Brands
  'logo-google': 'GoogleLogo',
  'logo-apple': 'AppleLogo',

  // Card-related
  'grid-outline': 'GridFour',
  'albums-outline': 'Stack',
  'heart-outline': 'Heart',
  'storefront-outline': 'Storefront',
  'add-circle-outline': 'PlusCircle',
  'arrow-back-outline': 'ArrowLeft',
  'swap-horizontal-outline': 'ArrowsLeftRight',
  'close-circle': 'XCircle',
} as const;
