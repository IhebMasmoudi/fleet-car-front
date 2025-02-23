import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/services/AuthGuard.service'; // Import the guard
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { AppIconsComponent } from './icons/icons.component';
import { AppSamplePageComponent } from './sample-page/sample-page.component';

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
        path: 'profile', // Define the route for the profile
        component: ProfileUserComponent,
        data: {
          title: 'Profile',
          urls: [{ title: 'Profile', url: '/Profile' }, { title: 'Profile' }],
        },
      },
    ],

  },
];
