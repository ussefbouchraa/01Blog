// Purpose: Register page component.
// Handles new user registration form, validation, and calls AuthService to register.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule],
  template: `<h2>Register</h2>`,
  styles: []
})
export class RegisterComponent {

}
