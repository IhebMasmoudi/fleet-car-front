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
    navCap: 'Garage',
    divider: true
  },
  {
    displayName: 'cars',
    iconName: 'solar:atom-line-duotone',
    route: '/cars',  
  },
  {
    displayName: 'Maintenance',
    iconName: 'solar:atom-line-duotone',
    route: '/maintenance',  
  },
  {
    displayName: 'Fuel Consumption',
    iconName: 'solar:atom-line-duotone',
    route: '/fuelconsumption',  
  },
  {
    displayName: 'tires',
    iconName: 'solar:atom-line-duotone',
    route: '/tires',  
  },
  {
    displayName: 'Parking Slot',
    iconName: 'solar:atom-line-duotone',
    route: '/parkingSlot',  
  },
  {
    navCap: 'Settings',
    divider: true
  },
  {
    displayName: 'users',
    iconName: 'solar:atom-line-duotone',
    route: '/users',  
  },
 
  {
    displayName: 'roles',
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