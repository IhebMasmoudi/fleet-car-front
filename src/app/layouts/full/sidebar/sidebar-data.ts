import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },
  {
    navCap: 'Fleet Management',
    divider: true
  },
  {
    displayName: 'Drivers',
    iconName: 'solar:atom-line-duotone',
    route: '/drivers',  
  },
  {
    displayName: 'Missions',
    iconName: 'solar:atom-line-duotone',
    route: '/missions',  
  },
  {
    navCap: 'Garage',
    divider: true
  },
  {
    displayName: 'Cars',
    iconName: 'solar:atom-line-duotone',
    route: '/cars',  
  },
  {
    displayName: 'Maintenances',
    iconName: 'solar:atom-line-duotone',
    route: '/maintenance',  
  },
  {
    displayName: 'Fuel Consumptions',
    iconName: 'solar:atom-line-duotone',
    route: '/fuelconsumption',  
  },
  {
    displayName: 'Tires',
    iconName: 'solar:atom-line-duotone',
    route: '/tires',  
  },
  {
    displayName: 'Parking Slots',
    iconName: 'solar:atom-line-duotone',
    route: '/parkingSlot',  
  },
  {
    navCap: 'Accounting',
    divider: true
  },
  {
    displayName: 'Suppliers',
    iconName: 'solar:atom-line-duotone',
    route: '/supplier',  
  },
  {
    displayName: 'Invoices',
    iconName: 'solar:atom-line-duotone',
    route: '/invoice',  
  },
  
  {
    navCap: 'Settings',
    divider: true
  },
  {
    displayName: 'Users',
    iconName: 'solar:atom-line-duotone',
    route: '/users',  
  },
 
  {
    displayName: 'Roles',
    iconName: 'solar:atom-line-duotone',
    route: '/roles',  
  },
  
 
  {
    navCap: 'Ui Components',
    divider: true
  },
  {
    displayName: 'Badge',
    iconName: 'solar:archive-minimalistic-line-duotone',
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
    iconName: 'solar:file-text-line-duotone',
    route: '/ui-components/forms',
  },
  {
    displayName: 'Tables',
    iconName: 'solar:tablet-line-duotone',
    route: '/ui-components/tables',
  },
]