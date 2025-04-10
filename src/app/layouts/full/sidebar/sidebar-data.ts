import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  // --- Home Section (Top Level) ---
  {
    navCap: 'Home', 
  },
  {
    displayName: 'Dashboard',
    iconName: 'tabler:layout-dashboard',
    route: '/dashboard',
  },

  // --- Fleet Management Section (Collapsible) ---
  {
    displayName: 'Fleet Management', 
    iconName: 'tabler:steering-wheel', 
    route: '', 
    children: [
      {
        displayName: 'Drivers',
        iconName: 'tabler:users',
        route: '/drivers',
      },
      {
        displayName: 'Missions',
        iconName: 'tabler:file-description',
        route: '/missions',
      },
    ],
  },

  // --- Garage Section (Collapsible) ---
  {
    displayName: 'Garage', 
    iconName: 'tabler:car-garage',
    route: '',
    children: [
      {
        displayName: 'Cars',
        iconName: 'tabler:car',
        route: '/cars',
      },
      {
        displayName: 'Maintenances',
        iconName: 'tabler:tools',
        route: '/maintenance',
      },
      {
        displayName: 'Fuel Consumptions',
        iconName: 'tabler:gas-station',
        route: '/fuelconsumption',
      },
      {
        displayName: 'Tires',
        iconName: 'tabler:wheel',
        route: '/tires',
      },
      {
        displayName: 'Parking Slots',
        iconName: 'tabler:parking',
        route: '/parkingSlot',
      },
    ],
  },

  // --- Accounting Section (Collapsible) ---
  {
    displayName: 'Accounting',
    iconName: 'tabler:calculator', 
    route: '',
    children: [
      {
        displayName: 'Insurance',
        iconName: 'tabler:shield-check',
        route: '/insurance',
      },
      {
        displayName: 'Suppliers',
        iconName: 'tabler:package',
        route: '/supplier',
      },
      {
        displayName: 'Invoices',
        iconName: 'tabler:receipt',
        route: '/invoice',
      },
    ],
  },

  // --- Settings Section (Collapsible) ---
  {
    displayName: 'Settings',
    iconName: 'tabler:settings',
    route: '',
    children: [
      {
        displayName: 'Users',
        iconName: 'tabler:user',
        route: '/users',
      },
      {
        displayName: 'Roles',
        iconName: 'tabler:adjustments',
        route: '/roles',
      },
    ],
  },

   /* --- UI Components Section (Collapsible) ---
   // Assuming you want this collapsible like the others
  {
    displayName: 'Ui Components', // Changed from navCap
    iconName: 'tabler:components', // Added parent icon
    route: '',
    // Removed divider: true as it's now part of the parent item logic
    children: [
       {
         displayName: 'Badge',
         iconName: 'solar:archive-minimalistic-line-duotone', // Kept original solar icons here
         route: '/ui-components/badge',
       },
       {
         displayName: 'Chips',
         iconName: 'solar:danger-circle-line-duotone',
         route: '/ui-components/chips',
       },
       {
         displayName: 'Lists',
         iconName: 'solar:bookmark-square-minimalistic-line-duotone',
         route: '/ui-components/lists',
       },
       {
         displayName: 'Menu',
         iconName: 'solar:file-text-line-duotone',
         route: '/ui-components/menu',
       },
       {
         displayName: 'Tooltips',
         iconName: 'solar:text-field-focus-line-duotone',
         route: '/ui-components/tooltips',
       },
       {
         displayName: 'Forms',
         iconName: 'solar:file-text-line-duotone', // Note: Same icon as Menu
         route: '/ui-components/forms',
       },
       {
         displayName: 'Tables',
         iconName: 'solar:tablet-line-duotone',
         route: '/ui-components/tables',
       },
    ]
  },*/
];
