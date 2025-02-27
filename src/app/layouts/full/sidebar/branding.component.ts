import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
   <div class="branding-container">
  <a [routerLink]="['/dashboard']" class="branding-link">
    <span class="branding-text">Fleet car system</span>
  </a>
</div>
  `,
  styles: [`
   .branding-container {
  display: flex;
  justify-content: center; // Center horizontally
  align-items: center; // Center vertically
  height: 100%; // Ensure full height of container
  background-color: transparent; // Remove any gray background if present
}

.branding-link {
  text-decoration: none; // Remove underline from link
  color: inherit; // Inherit parent color (default to black unless overridden)
}

.branding-text {
  color:rgb(0, 0, 0); // Set text color to blue (Bootstrap's primary blue color)
  font-size: 1.25rem; // Make the text slightly larger for emphasis
  font-weight: bold; // Add boldness for prominence
  letter-spacing: 0.5px; // Slightly increase spacing between letters for readability
}
  `]
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
