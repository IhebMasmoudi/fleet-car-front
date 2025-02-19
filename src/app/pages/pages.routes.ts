import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { UsersComponent } from './users/users.component';
import { CarsComponent } from './cars/cars.component';
import { RolesComponent } from './roles/roles.component';
import { TiresComponent } from './tires/tires.component';
import { ParkingslotComponent } from './parkingslot/parkingslot.component'; // Ensure this path is correct and the file exists
export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Starter' },
      ],
    },
  },
  {
    path: 'users',
    component: UsersComponent, 
    data: {
      title: 'Users',
      urls: [{ title: 'Users', url: '/Users' }, { title: 'Users' }],
    },
  },
  {
    path: 'cars',
    component: CarsComponent, 
    data: {
      title: 'Cars',
      urls: [{ title: 'Cars', url: '/Cars' }, { title: 'Cars' }],
    },
  },
  {
    path: 'roles',
    component: RolesComponent, 
    data: {
      title: 'Roles',
      urls: [{ title: 'Roles', url: '/Roles' }, { title: 'Roles' }],
    },
  },
  {
    path: 'tires',
    component: TiresComponent, 
    data: {
      title: 'Tires',
      urls: [{ title: 'Tires', url: '/Tires' }, { title: 'Tires' }],
    },
  },
  {
    path: 'parkingSlot',
    component: ParkingslotComponent, 
    data: {
      title: 'ParkingSlot',
      urls: [{ title: 'ParkingSlot', url: '/ParkingSlot' }, { title: 'ParkingSlot' }],
    },
  },
];
