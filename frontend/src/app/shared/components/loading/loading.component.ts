// Purpose: Loading indicator component.
// Used to show spinners/loaders during API calls or async operations.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `<div><!-- Loading spinner --></div>`,
  styles: []
})
export class LoadingComponent {

}
