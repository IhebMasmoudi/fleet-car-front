import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'tabler:layout-dashboard', // Tabler icon
    route: '/dashboard',
  },
  {
    navCap: 'Fleet Management',
    divider: true
  },
  {
    displayName: 'Drivers',
    iconName: 'tabler:users', // Tabler icon
    route: '/drivers', 
  },
  {
    displayName: 'Missions',
    iconName: 'tabler:file-description', // Tabler icon for tasks/missions
    route: '/missions',
  },
  {
    navCap: 'Garage',
    divider: true
  },
  {
    displayName: 'Cars',
    iconName: 'tabler:car', // Tabler icon for vehicles
    route: '/cars',
  },
  {
    displayName: 'Maintenances',
    iconName: 'tabler:tools', // Tabler icon for maintenance
    route: '/maintenance',
  },
  {
    displayName: 'Fuel Consumptions',
    iconName: 'tabler:gas-station', // Tabler icon for fuel
    route: '/fuelconsumption',
  },
  {
    displayName: 'Tires',
    iconName: 'tabler:wheel', // Tabler icon for tires
    route: '/tires',
  },
  {
    displayName: 'Parking Slots',
    iconName: 'tabler:parking', // Tabler icon for parking slots
    route: '/parkingSlot',
  },
  {
    navCap: 'Accounting',
    divider: true
  },
  {
    displayName: 'Insurance',
    iconName: 'tabler:shield-check', // Tabler icon for security/insurance
    route: '/insurance',
  },
  {
    displayName: 'Suppliers',
    iconName: 'tabler:package', // Tabler icon for suppliers/businesses
    route: '/supplier',
  },
  {
    displayName: 'Invoices',
    iconName: 'tabler:receipt', // Tabler icon for invoices/billing
    route: '/invoice',
  },
  {
    navCap: 'Settings',
    divider: true
  },
  {
    displayName: 'Users',
    iconName: 'tabler:user', // Tabler icon for user management
    route: '/users',
  },
  {
    displayName: 'Roles',
    iconName: 'tabler:settings', // Tabler icon for user roles/permissions
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