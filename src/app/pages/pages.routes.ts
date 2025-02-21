import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { UsersComponent } from './users/users.component';
import { CarsComponent } from './cars/cars.component';
import { RolesComponent } from './roles/roles.component';
import { TiresComponent } from './tires/tires.component';
import { ParkingslotComponent } from './parkingslot/parkingslot.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { FuelConsumptionComponent } from './fuelconsumption/fuelconsumption.component';
import { SupplierComponent } from './supplier/supplier.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { DriversComponent } from './drivers/drivers.component';
import { MissionsComponent } from './missions/missions.component';
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
  {
    path: 'maintenance',
    component: MaintenanceComponent, 
    data: {
      title: 'Maintenances',
      urls: [{ title: 'Maintenances', url: '/Maintenances' }, { title: 'Maintenances' }],
    },
  },
  {
    path: 'fuelconsumption',
    component: FuelConsumptionComponent, 
    data: {
      title: 'FuelConsumption',
      urls: [{ title: 'FuelConsumption', url: '/FuelConsumption' }, { title: 'FuelConsumption' }],
    },
  },
  {
    path: 'supplier',
    component: SupplierComponent, 
    data: {
      title: 'Supplier',
      urls: [{ title: 'Supplier', url: '/Supplier' }, { title: 'Supplier' }],
    },
  },
  {
    path: 'invoice',
    component: InvoiceComponent, 
    data: {
      title: 'Invoice',
      urls: [{ title: 'Invoice', url: '/Invoice' }, { title: 'Invoice' }],
    },
  },
  {
    path: 'drivers',
    component: DriversComponent, 
    data: {
      title: 'Drivers',
      urls: [{ title: 'Drivers', url: '/Drivers' }, { title: 'Drivers' }],
    },
  },
  {
    path: 'missions',
    component: MissionsComponent, 
    data: {
      title: 'Missions',
      urls: [{ title: 'Missions', url: '/Missions' }, { title: 'Missions' }],
    },
  },



];
