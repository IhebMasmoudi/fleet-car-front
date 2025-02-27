import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/services/AuthGuard.service'; // Import the guard
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { AppIconsComponent } from './icons/icons.component';
import { AppSamplePageComponent } from './sample-page/sample-page.component';
import { CarDetailsComponent } from './car-detaills/car-detaills.component';
import { DrivertasksComponent } from './drivertasks/drivertasks.component';
import { NotificationComponent } from './notification/notification.component';
import { NotificationListComponent } from './notification-list/notification-list.component';
export const ExtraRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'icons',
        component: AppIconsComponent,
      },
      {
        path: 'sample-page',
        component: AppSamplePageComponent,
      },
      {
        path: 'profile', 
        component: ProfileUserComponent,
        data: {
          title: 'Profile',
          urls: [{ title: 'Profile', url: '/Profile' }, { title: 'Profile' }],
        },
      },
      {
        path: 'notification-list', 
        component: NotificationListComponent,
        data: {
          title: 'notification-list',
          urls: [{ title: 'notification-list', url: '/notification-list' }, { title: 'notification-list' }],
        },
      },
      {
        path: 'notification', 
        component: NotificationComponent,
        data: {
          title: 'Notification',
          urls: [{ title: 'Notification', url: '/Notification' }, { title: 'Notification' }],
        },
      },
      {
        path: 'DriverTasks', 
        component: DrivertasksComponent,
        data: {
          title: 'DriverTasks',
          urls: [{ title: 'DriverTasks', url: '/DriverTasks' }, { title: 'DriverTasks' }],
        },
      },
      {
        path: 'CarDetaills/:id',
        component: CarDetailsComponent,
        data: { title: 'CarDetaills', urls: [{ title: 'CarDetaills', url: '/CarDetaills' }, { title: 'CarDetaills' }] },
      }      
    ],

  },
];
