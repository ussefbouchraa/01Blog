// Purpose: Navigation bar component.
// Displays app links, auth buttons (login/register/logout), and user info based on auth state.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `<nav><!-- Navbar content --></nav>`,
  styles: []
})
export class NavbarComponent {

}
