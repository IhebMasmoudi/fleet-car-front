import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <div class="branding-container">
      <a [routerLink]="['/']">
        <img
          src="assets/images/logos/Entreprise_tunisienne_d'activités_pétrolières_Logo.png"
          class="branding-logo"
          alt="logo"
        />
      </a>
    </div>
  `,
  styles: [`
    .branding-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
    .branding-logo {
      max-width: 100%;
      height: auto;
    }
  `]
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
