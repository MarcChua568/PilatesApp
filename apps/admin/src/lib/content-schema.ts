export type FieldType = 'text' | 'textarea' | 'image' | 'list' | 'kv-list';

export interface FieldDef {
  path: string; // key within the block's data object
  label: string;
  type: FieldType;
  // for kv-list: the two sub-keys of each item
  keys?: [string, string];
}

export interface BlockDef {
  key: string;
  label: string;
  group: string;
  fields: FieldDef[];
}

export const CONTENT_SCHEMA: BlockDef[] = [
  {
    key: 'about.hero',
    label: 'About — hero',
    group: 'About',
    fields: [
      { path: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'body', label: 'Body', type: 'textarea' },
      { path: 'imageUrl', label: 'Image', type: 'image' },
    ],
  },
  {
    key: 'about.philosophy',
    label: 'About — philosophy',
    group: 'About',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'paragraphs', label: 'Paragraphs', type: 'list' },
    ],
  },
  {
    key: 'about.values',
    label: 'About — values',
    group: 'About',
    fields: [
      {
        path: 'items',
        label: 'Values',
        type: 'kv-list',
        keys: ['title', 'body'],
      },
    ],
  },
  {
    key: 'space.hero',
    label: 'The Space — hero',
    group: 'The Space',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'body', label: 'Body', type: 'textarea' },
      { path: 'imageUrl', label: 'Image', type: 'image' },
    ],
  },
  {
    key: 'space.stats',
    label: 'The Space — stats',
    group: 'The Space',
    fields: [
      {
        path: 'items',
        label: 'Stats',
        type: 'kv-list',
        keys: ['label', 'value'],
      },
    ],
  },
  {
    key: 'space.gallery',
    label: 'The Space — gallery',
    group: 'The Space',
    fields: [
      {
        path: 'images',
        label: 'Images',
        type: 'kv-list',
        keys: ['src', 'alt'],
      },
    ],
  },
  {
    key: 'cafe.block',
    label: 'Café block',
    group: 'The Space',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'body', label: 'Body', type: 'textarea' },
      { path: 'imageUrl', label: 'Image', type: 'image' },
    ],
  },
  {
    key: 'home.testimonials',
    label: 'Home — testimonials',
    group: 'Home',
    fields: [
      {
        path: 'items',
        label: 'Testimonials',
        type: 'kv-list',
        keys: ['quote', 'name'],
      },
    ],
  },
  {
    key: 'home.gallery',
    label: 'Home — gallery',
    group: 'Home',
    fields: [
      {
        path: 'images',
        label: 'Images',
        type: 'kv-list',
        keys: ['src', 'alt'],
      },
    ],
  },
  {
    key: 'location.gettingHere',
    label: 'Location — getting here',
    group: 'Location',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'body', label: 'Body', type: 'textarea' },
      { path: 'landmarks', label: 'Landmarks', type: 'list' },
    ],
  },
  {
    key: 'contact.intro',
    label: 'Contact — intro',
    group: 'Contact',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'body', label: 'Body', type: 'textarea' },
    ],
  },
];
